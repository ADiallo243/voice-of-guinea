import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export const metadata: Metadata = {
  title: "Désabonnement de la newsletter",
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let unsubscribed = false;

  if (token) {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("unsubscribe_token", token)
        .select("id")
        .maybeSingle();
      unsubscribed = !error && Boolean(data);
    } catch (error) {
      console.error("Newsletter unsubscribe failed.", error);
    }
  }

  return (
    <section className="shell newsletter-result">
      <span className="section-kicker">La lettre de Voice of Guinea</span>
      <h1>{unsubscribed ? "Vous êtes désabonné." : "Impossible de traiter ce lien."}</h1>
      <p>
        {unsubscribed
          ? "Vous ne recevrez plus la newsletter de Voice of Guinea. Vous pourrez vous réinscrire à tout moment."
          : "Le lien de désabonnement est invalide. Contactez la rédaction si le problème persiste."}
      </p>
      <Link className="button" href="/">Retour à l’accueil</Link>
    </section>
  );
}
