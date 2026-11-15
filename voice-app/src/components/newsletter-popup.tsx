"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { NewsletterForm } from "./newsletter-form";
import { track } from "@/lib/engagement";
const KEY = "vog:newsletter";
export function NewsletterPopup() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (
      !pathname.startsWith("/articles/") ||
      /bot|crawler|spider|headless/i.test(navigator.userAgent)
    )
      return;
    const started = Date.now();
    let previousFocus: HTMLElement | null = null;
    const eligible = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
        if (
          saved.subscribed ||
          saved.pending ||
          Date.now() - (saved.dismissed || 0) < 30 * 86400000 ||
          sessionStorage.getItem(`${KEY}:shown`)
        )
          return;
        if (
          Date.now() - started < 35_000 ||
          document.visibilityState !== "visible"
        )
          return;
        const scrollable = document.documentElement.scrollHeight - innerHeight;
        if (scrollable <= 0 || scrollY / scrollable < 0.5) return;
        if (
          document.querySelector(
            '.consent-banner, [data-naya-open="true"], dialog[open]',
          ) ||
          document.activeElement?.matches("input,textarea,button,select")
        )
          return;
        previousFocus = document.activeElement as HTMLElement;
        sessionStorage.setItem(`${KEY}:shown`, "1");
        dialog.current?.showModal();
        track("newsletter_popup_shown");
      } catch {
        /* Suppress when browser storage is unavailable. */
      }
    };
    const timer = setInterval(eligible, 3000);
    const element = dialog.current;
    const close = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
        localStorage.setItem(
          KEY,
          JSON.stringify({ ...saved, dismissed: Date.now() }),
        );
      } catch {}
      track("newsletter_popup_dismissed");
      previousFocus?.focus();
    };
    element?.addEventListener("close", close);
    return () => {
      clearInterval(timer);
      element?.removeEventListener("close", close);
      element?.close();
      previousFocus?.focus();
    };
  }, [pathname]);
  return (
    <dialog
      ref={dialog}
      className="newsletter-popup"
      aria-labelledby="newsletter-popup-title"
    >
      <button
        className="newsletter-close"
        autoFocus
        type="button"
        aria-label="Fermer l’invitation"
        onClick={() => dialog.current?.close()}
      >
        ×
      </button>
      <span className="section-kicker">RESTEZ INFORMÉ</span>
      <h2 id="newsletter-popup-title">La Guinée, dans votre boîte mail.</h2>
      <p>
        Recevez l’essentiel de l’actualité guinéenne, nos décryptages et les
        histoires à ne pas manquer.
      </p>
      <NewsletterForm popup />
      <button
        className="newsletter-later"
        type="button"
        onClick={() => dialog.current?.close()}
      >
        Pas maintenant
      </button>
    </dialog>
  );
}
