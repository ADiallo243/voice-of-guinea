import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribeFromNewsletter } from "../actions";

export const metadata: Metadata = {
  title: "Désabonnement de la newsletter",
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; unsubscribed?: string; error?: string }>;
}) {
  const { token, unsubscribed, error } = await searchParams;
  const hasToken = Boolean(token);
  const isComplete = unsubscribed === "1";

  return (
    <section className="shell newsletter-result">
      <span className="section-kicker">Newsletter</span>
      <h1>{isComplete ? "Vous êtes désabonné." : hasToken ? "Confirmer le désabonnement" : "Impossible de traiter ce lien."}</h1>
      <p>
        {isComplete
          ? "Vous ne recevrez plus la newsletter de Voice of Guinea. Vous pourrez vous réinscrire à tout moment."
          : hasToken
            ? "Confirmez votre choix pour ne plus recevoir la newsletter de Voice of Guinea."
            : error === "unavailable"
              ? "Le désabonnement est momentanément indisponible. Réessayez plus tard ou contactez la rédaction."
              : "Le lien de désabonnement est invalide. Contactez la rédaction si le problème persiste."}
      </p>
      {hasToken && !isComplete && (
        <form action={unsubscribeFromNewsletter}>
          <input type="hidden" name="token" value={token} />
          <button className="button" type="submit">Confirmer le désabonnement</button>
        </form>
      )}
      <Link className="button" href="/">Retour à l’accueil</Link>
    </section>
  );
}
