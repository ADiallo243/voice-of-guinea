import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export const metadata: Metadata = {
  title: "Confirmation de l’abonnement",
  robots: { index: false, follow: false },
};

export default async function NewsletterConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let confirmed = false;

  if (token) {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "active",
          confirmed_at: new Date().toISOString(),
          unsubscribed_at: null,
        })
        .eq("confirmation_token", token)
        .in("status", ["pending", "active"])
        .select("id")
        .maybeSingle();
      confirmed = !error && Boolean(data);
    } catch (error) {
      console.error("Newsletter confirmation failed.", error);
    }
  }

  return (
    <section className="shell newsletter-result">
      <span className="section-kicker">Newsletter</span>
      <h1>{confirmed ? "Votre abonnement est confirmé." : "Ce lien n’est plus valide."}</h1>
      <p>
        {confirmed
          ? "Bienvenue dans la communauté Voice of Guinea. Vous recevrez prochainement notre sélection d’actualités."
          : "Le lien a peut-être déjà été utilisé ou a été modifié. Vous pouvez vous inscrire à nouveau depuis le site."}
      </p>
      <Link className="button" href="/">Retour à l’accueil</Link>
    </section>
  );
}
