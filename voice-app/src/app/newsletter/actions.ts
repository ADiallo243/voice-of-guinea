"use server";

import { createHash, createHmac, randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { siteConfig } from "@/lib/site";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: NewsletterState = { status: "idle", message: "" };
const subscriptionMessage = "Merci. Vérifiez votre boîte e-mail si une confirmation est nécessaire.";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token.toLowerCase()).digest("hex");
}

async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
    cache: "no-store",
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

async function sendConfirmationEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL || process.env.SOCIAL_PACK_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Newsletter email delivery is not configured.");

  const confirmationUrl = new URL("/newsletter/confirm", siteConfig.url);
  confirmationUrl.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirmez votre inscription à Voice of Guinea",
      html: `<p>Merci de votre intérêt pour Voice of Guinea.</p><p><a href="${confirmationUrl.toString()}">Confirmer mon inscription</a></p><p>Vous ne recevrez aucune newsletter sans cette confirmation.</p>`,
      text: `Merci de votre intérêt pour Voice of Guinea. Confirmez votre inscription : ${confirmationUrl.toString()}`,
    }),
  });
  if (!response.ok) throw new Error(`Newsletter confirmation email failed (${response.status}).`);
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

    const now = new Date().toISOString();
    const confirmationToken = randomUUID();
    if (existing) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: existing.status === "active" ? "active" : "pending",
          consent_at: now,
          confirmation_token_hash: tokenHash(confirmationToken),
          confirmed_at: existing.status === "active" ? now : null,
          confirmation_sent_at: existing.status === "active" ? null : now,
          unsubscribed_at: null,
        })
        .eq("id", existing.id);
      if (error) throw error;
      if (existing.status !== "active") await sendConfirmationEmail(email, confirmationToken);
    } else {
      const unsubscribeToken = randomUUID();
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email,
        status: "pending",
        source: "website",
        confirmation_token_hash: tokenHash(confirmationToken),
        unsubscribe_token_hash: tokenHash(unsubscribeToken),
        confirmation_sent_at: now,
      });
      if (error) throw error;
      await sendConfirmationEmail(email, confirmationToken);
    }

    return { status: "success", message: subscriptionMessage };
  } catch (error) {
    console.error("Newsletter subscription failed.", error);
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
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "active", confirmed_at: new Date().toISOString() })
      .eq("confirmation_token_hash", tokenHash(token))
      .eq("status", "pending")
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
