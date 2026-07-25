"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

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
  if (website) return { status: "success", message: "Merci, votre abonnement est activé." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { status: "error", message: "Entrez une adresse e-mail valide." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: existing, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("id, status")
      .ilike("email", email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existing?.status === "active") {
      return { status: "success", message: "Cette adresse est déjà abonnée." };
    }

    const now = new Date().toISOString();
    if (existing) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "active",
          consent_at: now,
          confirmed_at: now,
          confirmation_sent_at: null,
          unsubscribed_at: null,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email,
        status: "active",
        source: "website",
        confirmed_at: now,
      });
      if (error) throw error;
    }

    return {
      status: "success",
      message: "Merci, votre abonnement est activé.",
    };
  } catch (error) {
    console.error("Newsletter subscription failed.", error);
    return {
      status: "error",
      message: "L’inscription est momentanément indisponible. Réessayez plus tard.",
    };
  }
}
