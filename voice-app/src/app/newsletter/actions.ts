"use server";

import { createHash, createHmac, randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: NewsletterState = { status: "idle", message: "" };
const subscriptionMessage = "Si nécessaire, un e-mail de confirmation vous sera envoyé. Vérifiez votre boîte mail.";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token.toLowerCase()).digest("hex");
}

async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Turnstile adds another layer when configured. The persistent IP/e-mail
  // quota and honeypot remain active when it is not configured.
  if (!secret) return true;
  if (!token) return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const result = await response.json() as { success?: boolean };
  return response.ok && result.success === true;
}

async function consumeSignupQuota(email: string) {
  const secret = process.env.NEWSLETTER_RATE_LIMIT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("Newsletter rate limit is not configured.");
    return;
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || "unknown";
  const fingerprint = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  const supabase = createSupabaseAdminClient();

  for (const key of [fingerprint(`ip:${ip}`), fingerprint(`email:${email}`)]) {
    const { data, error } = await supabase.rpc("consume_newsletter_signup_quota", { attempt_key: key });
    if (error) throw error;
    if (!data) throw new Error("Too many newsletter signup attempts.");
  }
}

export async function subscribeToNewsletter(
  previousState: NewsletterState = initialState,
  formData: FormData,
): Promise<NewsletterState> {
  void previousState;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const website = String(formData.get("website") ?? "").trim();
  if (website) return { status: "success", message: subscriptionMessage };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { status: "error", message: "Entrez une adresse e-mail valide." };
  }

  try {
    const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
    if (!await verifyTurnstile(turnstileToken)) {
      return { status: "error", message: "La vérification anti-spam a échoué. Réessayez." };
    }
    await consumeSignupQuota(email);
    const supabase = createSupabaseAdminClient();
    const { data: existing, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("id, status")
      .ilike("email", email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    // Never rotate an active subscriber’s unsubscribe token on anonymous resubmission.
    if (existing?.status === "active") return { status: "success", message: subscriptionMessage };
    if (!process.env.RESEND_API_KEY || !process.env.NEWSLETTER_FROM_EMAIL) throw new Error("Newsletter delivery is not configured.");
    const now = new Date().toISOString();
    const confirmationToken = randomUUID();
    const unsubscribeToken = randomUUID();
    if (existing) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "pending",
          consent_at: now,
          confirmation_token_hash: tokenHash(confirmationToken),
          unsubscribe_token_hash: tokenHash(unsubscribeToken),
          confirmed_at: null,
          confirmation_sent_at: now,
          unsubscribed_at: null,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email,
        status: "pending",
        source: "website",
        consent_at: now,
        confirmation_token_hash: tokenHash(confirmationToken),
        unsubscribe_token_hash: tokenHash(unsubscribeToken),
        confirmation_sent_at: now,
        confirmed_at: null,
      });
      if (error) throw error;
    }

    const base = "https://www.voiceofguinea.com";
    const confirmationUrl = `${base}/newsletter/confirm?token=${confirmationToken}`;
    const unsubscribeUrl = `${base}/newsletter/unsubscribe?token=${unsubscribeToken}`;
    const delivery = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `newsletter-${confirmationToken}` },
      body: JSON.stringify({ from: process.env.NEWSLETTER_FROM_EMAIL, to: [email], subject: "Confirmez votre inscription à Voice of Guinea", text: `Vous avez demandé la newsletter de Voice of Guinea. Confirmez sous 48 heures : ${confirmationUrl}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.\nDésabonnement : ${unsubscribeUrl}` }),
    });
    if (!delivery.ok) throw new Error("Newsletter confirmation delivery failed.");
    return { status: "success", message: subscriptionMessage };
  } catch (error) {
    void error;
    console.error("Newsletter subscription failed.");
    return {
      status: "error",
      message: "L’inscription est momentanément indisponible. Réessayez plus tard.",
    };
  }
}

export async function unsubscribeFromNewsletter(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!isUuid(token)) redirect("/newsletter/unsubscribe?error=invalid-token");

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token_hash", tokenHash(token));

    if (error) throw error;
  } catch (error) {
    console.error("Newsletter unsubscribe failed.", error);
    redirect("/newsletter/unsubscribe?error=unavailable");
  }

  redirect("/newsletter/unsubscribe?unsubscribed=1");
}

export async function confirmNewsletterSubscription(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!isUuid(token)) redirect("/newsletter/confirm?error=invalid-token");

  let confirmed = false;
  try {
    const supabase = createSupabaseAdminClient();
    const confirmationCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "active", confirmed_at: new Date().toISOString() })
      .eq("confirmation_token_hash", tokenHash(token))
      .eq("status", "pending")
      .gte("confirmation_sent_at", confirmationCutoff)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    confirmed = Boolean(data);
  } catch (error) {
    console.error("Newsletter confirmation failed.", error);
    redirect("/newsletter/confirm?error=unavailable");
  }

  if (!confirmed) redirect("/newsletter/confirm?error=invalid-token");
  redirect("/newsletter/confirm?confirmed=1");
}
