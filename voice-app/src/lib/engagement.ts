"use client";
export function track(event: string, parameters: Record<string, string> = {}) {
  try {
    const saved = JSON.parse(
      localStorage.getItem("voice-of-guinea-analytics-consent") || "null",
    );
    if (
      saved?.choice === "accepted" &&
      Date.now() - saved.savedAt < 180 * 86400000
    )
      window.gtag?.("event", event, parameters);
  } catch {
    /* Storage may be unavailable. */
  }
}
