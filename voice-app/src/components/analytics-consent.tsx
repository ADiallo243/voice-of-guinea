"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const analyticsId = "G-V707W55KR5";
const storageKey = "voiceofguinea-analytics-consent-v1";

type Consent = "accepted" | "declined" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function loadAnalytics() {
  if (document.querySelector(`script[data-vog-analytics="${analyticsId}"]`)) return;

  (window as unknown as Record<string, unknown>)[`ga-disable-${analyticsId}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("js", new Date());
  window.gtag("config", analyticsId, { anonymize_ip: true, send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  script.dataset.vogAnalytics = analyticsId;
  document.head.appendChild(script);
}

function disableAnalytics() {
  (window as unknown as Record<string, unknown>)[`ga-disable-${analyticsId}`] = true;
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  document.querySelector(`script[data-vog-analytics="${analyticsId}"]`)?.remove();
  document.cookie = "_ga=; Max-Age=0; path=/; SameSite=Lax";
  document.cookie = `_ga_${analyticsId.replace("G-", "")}=; Max-Age=0; path=/; SameSite=Lax`;
  window.dataLayer = [];
  window.gtag = undefined;
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const saved = localStorage.getItem(storageKey) as Consent;
    if (saved === "accepted") {
      setConsent(saved);
      loadAnalytics();
    } else if (saved === "declined") {
      setConsent(saved);
    } else {
      setIsOpen(true);
    }

    const openPreferences = () => setIsOpen(true);
    window.addEventListener("vog:open-consent", openPreferences);
    return () => window.removeEventListener("vog:open-consent", openPreferences);
  }, [pathname]);

  useEffect(() => {
    if (!pathname.startsWith("/admin") && consent === "accepted" && window.gtag) {
      window.gtag("event", "page_view", { page_path: pathname });
    }
  }, [consent, pathname]);

  function choose(nextConsent: Exclude<Consent, null>) {
    localStorage.setItem(storageKey, nextConsent);
    setConsent(nextConsent);
    setIsOpen(false);
    if (nextConsent === "accepted") loadAnalytics();
    else disableAnalytics();
  }

  if (!isOpen || pathname.startsWith("/admin")) return null;

  return (
    <aside className="consent-panel" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
      <div>
        <h2 id="consent-title">Votre vie privée, votre choix</h2>
        <p id="consent-description">
          Nous utilisons Google Analytics uniquement avec votre accord pour comprendre l’utilisation du site et l’améliorer.
          Vous pouvez refuser sans perdre aucune fonctionnalité. <Link href="/confidentialite">En savoir plus</Link>.
        </p>
      </div>
      <div className="consent-actions">
        <button type="button" className="consent-secondary" onClick={() => choose("declined")}>Refuser</button>
        <button type="button" className="button" onClick={() => choose("accepted")}>Accepter</button>
      </div>
    </aside>
  );
}
