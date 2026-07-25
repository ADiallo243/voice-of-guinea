"use client";

import { usePathname } from "next/navigation";
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
    <>
      <SiteHeader headlines={headlines} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
