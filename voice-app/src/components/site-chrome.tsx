"use client";

import { usePathname } from "next/navigation";
import { EngagementEvents } from "./engagement-events";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import type { BreakingHeadline } from "@/lib/content";

export function SiteChrome({
  children,
  headlines,
  categories,
}: {
  children: React.ReactNode;
  headlines: BreakingHeadline[];
  categories: import("@/lib/content").PublicCategory[];
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="public-site">
      <a className="skip-link" href="#contenu-principal">
        Aller au contenu principal
      </a>
      <EngagementEvents />
      <SiteHeader headlines={headlines} categories={categories} />
      <main id="contenu-principal" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter categories={categories} />
    </div>
  );
}
