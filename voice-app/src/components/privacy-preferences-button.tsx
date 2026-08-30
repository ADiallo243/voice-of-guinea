"use client";

export function PrivacyPreferencesButton() {
  return (
    <button
      type="button"
      className="footer-preferences"
      onClick={() => window.dispatchEvent(new Event("vog:open-consent"))}
    >
      Gérer mes préférences
    </button>
  );
}
