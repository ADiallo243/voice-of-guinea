"use client";

export function CookieSettingsButton() {
  return (
    <button
      className="cookie-settings-button"
      type="button"
      onClick={() => window.dispatchEvent(new Event("vog:open-cookie-settings"))}
    >
      Gérer mes cookies
    </button>
  );
}
