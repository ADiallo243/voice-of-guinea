"use client";

import { useActionState } from "react";
import Link from "next/link";
import Script from "next/script";
import { subscribeToNewsletter, type NewsletterState } from "@/app/newsletter/actions";

const initialState: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialState);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!turnstileSiteKey && process.env.NODE_ENV === "production") {
    return (
      <div className="newsletter-unavailable" role="status">
        <strong>La newsletter arrive bientôt.</strong>
        <span>Nous finalisons l’inscription sécurisée avant son ouverture.</span>
      </div>
    );
  }

  return (
    <form action={action} className={compact ? "newsletter-form compact" : "newsletter-form"}>
      <div className="newsletter-fields">
        <label>
          <span className="sr-only">Adresse e-mail</span>
          <input name="email" type="email" required autoComplete="email" placeholder="votre@email.com" />
        </label>
        <input className="newsletter-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {turnstileSiteKey && (
          <>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
            <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-size="flexible" />
          </>
        )}
        <button type="submit" disabled={pending}>{pending ? "Envoi…" : "S’abonner"}</button>
      </div>
      {state.message && <p className={`newsletter-message ${state.status}`} role="status">{state.message}</p>}
      <small>Après confirmation de votre e-mail, vous pourrez recevoir nos e-mails. Désabonnement possible à tout moment. Consultez notre <Link href="/confidentialite">politique de confidentialité</Link>.</small>
    </form>
  );
}
