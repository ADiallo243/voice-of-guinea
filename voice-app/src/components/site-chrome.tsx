"use client";

import { usePathname } from "next/navigation";
import { EngagementEvents } from "./engagement-events";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import type { BreakingHeadline } from "@/lib/content";

export function SiteChrome({
  children,
  headlines,
}: {
  children: React.ReactNode;
  headlines: BreakingHeadline[];
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="public-site">
      <a className="skip-link" href="#contenu-principal">Aller au contenu principal</a>
      <EngagementEvents />
      <SiteHeader headlines={headlines} />
      <main id="contenu-principal" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </div>
  );
}
