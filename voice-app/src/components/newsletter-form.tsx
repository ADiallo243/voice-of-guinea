"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { NewsletterChallenge } from "./newsletter-challenge";
import { subscribeToNewsletter, type NewsletterState } from "@/app/newsletter/actions";

import { track } from "@/lib/engagement";

const initialState: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({ compact = false, popup = false, source = "inline" }: { compact?: boolean; popup?: boolean; source?: string }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialState);
  const announced = useRef(state);
  useEffect(() => {
    if (announced.current === state) return;
    announced.current = state;
    if (state.status === "idle") return;
    track(state.status === "success" ? "newsletter_confirmation_requested" : "newsletter_subscription_error", { placement: popup ? "popup" : source });
    if (state.status === "success") {
      try { localStorage.setItem("vog:newsletter", JSON.stringify({ pending: true })); } catch {}
    }
  }, [state, popup, source]);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <form action={action} onSubmit={() => track("newsletter_form_submitted", { placement: popup ? "popup" : source })} className={compact ? "newsletter-form compact" : "newsletter-form"}>
      <div className="newsletter-fields">
        <label>
          <span className="sr-only">Adresse e-mail</span>
          <input name="email" type="email" required autoComplete="email" placeholder="Votre adresse e-mail" />
        </label>
        <input className="newsletter-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {turnstileSiteKey && <NewsletterChallenge siteKey={turnstileSiteKey} resetKey={state} />}
        <button type="submit" disabled={pending}>{pending ? "Envoi…" : popup ? "Être au courant" : "Recevoir l’essentiel"}</button>
      </div>
      {state.message && <p className={`newsletter-message ${state.status}`} role="status">{state.message}</p>}
      <small>{popup ? <>En vous inscrivant, vous acceptez la newsletter. Désabonnement à tout moment. <Link href="/confidentialite">Confidentialité</Link>.</> : <>En vous inscrivant, vous acceptez de recevoir la newsletter de Voice of Guinea. Désabonnement possible à tout moment. Consultez notre <Link href="/confidentialite">politique de confidentialité</Link>.</>}</small>
    </form>
  );
}
