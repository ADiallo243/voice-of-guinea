"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/app/newsletter/actions";

const initialState: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form action={action} className={compact ? "newsletter-form compact" : "newsletter-form"}>
      <div className="newsletter-fields">
        <label>
          <span className="sr-only">Adresse e-mail</span>
          <input name="email" type="email" required autoComplete="email" placeholder="votre@email.com" />
        </label>
        <input className="newsletter-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button type="submit" disabled={pending}>{pending ? "Envoi…" : "S’abonner"}</button>
      </div>
      {state.message && <p className={`newsletter-message ${state.status}`} role="status">{state.message}</p>}
      <small>En vous inscrivant, vous acceptez de recevoir nos e-mails. Désabonnement possible à tout moment.</small>
    </form>
  );
}
