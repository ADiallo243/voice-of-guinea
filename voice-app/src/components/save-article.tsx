"use client";

import { useSyncExternalStore } from "react";

const storageEvent = "voice-of-guinea-saved-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(storageEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(storageEvent, callback);
  };
}

export function SaveArticle({ slug }: { slug: string }) {
  const saved = useSyncExternalStore(subscribe, () => {
    const savedArticles = JSON.parse(localStorage.getItem("voice-of-guinea-saved") || "[]") as string[];
    return savedArticles.includes(slug);
  }, () => false);

  function toggle() {
    const savedArticles = JSON.parse(localStorage.getItem("voice-of-guinea-saved") || "[]") as string[];
    const next = savedArticles.includes(slug)
      ? savedArticles.filter((item) => item !== slug)
      : [...savedArticles, slug];
    localStorage.setItem("voice-of-guinea-saved", JSON.stringify(next));
    window.dispatchEvent(new Event(storageEvent));
  }

  return <button className="save-article" type="button" onClick={toggle}>{saved ? "✓ Article enregistré" : "☆ Enregistrer"}</button>;
}
