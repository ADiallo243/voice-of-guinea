"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; size: string },
      ) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

// Explicit rendering supports forms mounted after the script has already loaded,
// including the delayed newsletter invitation and client-side navigation.
export function NewsletterChallenge({
  siteKey,
  resetKey,
}: {
  siteKey: string;
  resetKey: object;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      size: "flexible",
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [ready, siteKey]);
  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={container} />
    </>
  );
}
