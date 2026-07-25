"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { sendNewsletterConfirmation } from "@/lib/newsletter-email";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: NewsletterState = { status: "idle", message: "" };

export async function subscribeToNewsletter(
  previousState: NewsletterState = initialState,
  formData: FormData,
): Promise<NewsletterState> {
  void previousState;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const website = String(formData.get("website") ?? "").trim();
  if (website) return { status: "success", message: "Vérifiez votre boîte e-mail pour confirmer." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { status: "error", message: "Entrez une adresse e-mail valide." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: existing, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, confirmation_token, confirmation_sent_at")
      .ilike("email", email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existing?.status === "active") {
      return { status: "success", message: "Cette adresse est déjà abonnée." };
    }

    const recentlySent = existing?.confirmation_sent_at
      && Date.now() - new Date(existing.confirmation_sent_at).getTime() < 15 * 60 * 1000;
    if (recentlySent) {
      return { status: "success", message: "Un e-mail de confirmation a déjà été envoyé." };
    }

    const token = existing?.confirmation_token ?? crypto.randomUUID();
    if (existing) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "pending",
          confirmation_token: token,
          consent_at: new Date().toISOString(),
          unsubscribed_at: null,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email,
        status: "pending",
        source: "website",
        confirmation_token: token,
      });
      if (error) throw error;
    }

    await sendNewsletterConfirmation(email, token);
    const { error: sentAtError } = await supabase
      .from("newsletter_subscribers")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .ilike("email", email);
    if (sentAtError) console.error("Could not store newsletter confirmation timestamp.", sentAtError);
    return {
      status: "success",
      message: "Vérifiez votre boîte e-mail pour confirmer votre abonnement.",
    };
  } catch (error) {
    console.error("Newsletter subscription failed.", error);
    return {
      status: "error",
      message: "L’inscription est momentanément indisponible. Réessayez plus tard.",
    };
  }
}
