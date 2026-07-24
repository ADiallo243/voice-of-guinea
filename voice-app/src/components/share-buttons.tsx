"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = useSyncExternalStore(
    subscribe,
    () => window.location.href,
    () => "",
  );

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="share-row">
      <span>Partager</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">Facebook</a>
      <button type="button" onClick={copyLink}>{copied ? "Lien copié" : "Copier le lien"}</button>
    </div>
  );
}
