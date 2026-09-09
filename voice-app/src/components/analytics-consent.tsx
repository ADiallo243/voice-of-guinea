"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

type Consent = "accepted" | "refused";

const STORAGE_KEY = "voice-of-guinea-analytics-consent";
const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
const CHANGE_EVENT = "vog:cookie-consent-change";

function readConsent(): Consent | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as { choice?: Consent; savedAt?: number } | null;
    if (!saved || (saved.choice !== "accepted" && saved.choice !== "refused") || !saved.savedAt) return null;
    return Date.now() - saved.savedAt < CONSENT_LIFETIME_MS ? saved.choice : null;
  } catch {
    return null;
  }
}

function removeAnalyticsCookies() {
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
  const domains = ["", `; domain=${window.location.hostname}`, `; domain=.${window.location.hostname}`];
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.trim().split("=")[0];
    if (name === "_ga" || name.startsWith("_ga_")) {
      domains.forEach((domain) => { document.cookie = `${name}=; ${expires}${domain}`; });
    }
  });
}

function subscribeToConsent(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function AnalyticsConsent({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener("vog:open-cookie-settings", openSettings);
    return () => window.removeEventListener("vog:open-cookie-settings", openSettings);
  }, []);

  function choose(nextConsent: Consent) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: nextConsent, savedAt: Date.now() }));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    if (nextConsent === "refused") {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      removeAnalyticsCookies();
    }
    setSettingsOpen(false);
  }

  // Confirmation and unsubscribe URLs include one-time secrets. Never send those
  // URLs to analytics, even where the reader has otherwise accepted analytics.
  if (pathname.startsWith("/admin") || pathname.startsWith("/newsletter/confirm") || pathname.startsWith("/newsletter/unsubscribe")) return null;
  const showBanner = !consent || settingsOpen;

  return (
    <>
      {consent === "accepted" && (
        <>
          <Script id="google-analytics-consent" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('js', new Date());
              gtag('config', '${measurementId}');
            `}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
        </>
      )}
      {showBanner && (
        <aside className="consent-banner" role="region" aria-label="Préférences de confidentialité">
          <div>
            <strong>{settingsOpen ? "Vos préférences de confidentialité" : "Votre vie privée compte."}</strong>
            <p>Avec votre accord, nous utilisons Google Analytics pour mesurer l’audience de Voice of Guinea. Refuser n’empêche pas de lire le site. Vous pouvez modifier votre choix à tout moment.</p>
            <p><a href="/cookies">En savoir plus sur les cookies</a> · <a href="/confidentialite">Politique de confidentialité</a></p>
          </div>
          <div className="consent-actions">
            <button className="consent-reject" type="button" onClick={() => choose("refused")}>Tout refuser</button>
            <button className="consent-accept" type="button" onClick={() => choose("accepted")}>Tout accepter</button>
          </div>
        </aside>
      )}
    </>
  );
}

declare global {
  interface Window {
    gtag?: (command: string, target: string, parameters?: Record<string, string>) => void;
  }
}
