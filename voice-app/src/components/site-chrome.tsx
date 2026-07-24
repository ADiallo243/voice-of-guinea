"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
