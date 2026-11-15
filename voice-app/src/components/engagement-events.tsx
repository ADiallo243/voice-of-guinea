"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/engagement";
export function EngagementEvents() {
  const path = usePathname();
  const viewed = useRef("");
  useEffect(() => {
    if (viewed.current !== path && path.startsWith("/articles/"))
      track("article_viewed", { article_path: path });
    viewed.current = path;
    if (
      path === "/newsletter/confirm" &&
      new URLSearchParams(location.search).get("confirmed") === "1"
    ) {
      try {
        localStorage.setItem(
          "vog:newsletter",
          JSON.stringify({ subscribed: true }),
        );
      } catch {}
      try {
        if (!sessionStorage.getItem("vog:newsletter:confirmed")) {
          track("newsletter_subscription_success");
          sessionStorage.setItem("vog:newsletter:confirmed", "1");
        }
      } catch {}
    }
    const click = (event: MouseEvent) => {
      const target = (event.target as Element).closest?.(
        '.related-section a[href^="/articles/"]',
      );
      if (target) track("related_article_clicked");
    };
    const submit = (event: SubmitEvent) => {
      if ((event.target as Element).matches(".public-search"))
        track("internal_search_used");
    };
    document.addEventListener("click", click);
    document.addEventListener("submit", submit);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("submit", submit);
    };
  }, [path]);
  return null;
}
