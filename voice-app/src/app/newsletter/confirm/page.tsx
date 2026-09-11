import type { Metadata } from "next";
import Link from "next/link";
import { confirmNewsletterSubscription } from "../actions";

export const metadata: Metadata = {
  title: "Confirmation de la newsletter",
  robots: { index: false, follow: false },
};

export default async function NewsletterConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; confirmed?: string; error?: string }>;
}) {
  const { token, confirmed, error } = await searchParams;
  const isComplete = confirmed === "1";
  const hasToken = Boolean(token);

  return (
    <section className="shell newsletter-result">
      <span className="section-kicker">Newsletter</span>
      <h1>{isComplete ? "Votre inscription est confirmée." : hasToken ? "Confirmer votre inscription" : "Impossible de traiter ce lien."}</h1>
      <p>
        {isComplete
          ? "Vous recevrez désormais la newsletter de Voice of Guinea. Vous pourrez vous désabonner à tout moment."
          : hasToken
            ? "Confirmez votre choix pour recevoir la newsletter de Voice of Guinea."
            : error === "unavailable"
              ? "La confirmation est momentanément indisponible. Réessayez plus tard."
              : "Le lien de confirmation est invalide ou a déjà été utilisé."}
      </p>
      {hasToken && !isComplete && (
        <form action={confirmNewsletterSubscription}>
          <input type="hidden" name="token" value={token} />
          <button className="button" type="submit">Confirmer mon inscription</button>
        </form>
      )}
      <Link className="button" href="/">Retour à l’accueil</Link>
    </section>
  );
}
