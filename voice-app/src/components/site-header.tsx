"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { BreakingHeadline } from "@/lib/content";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/actualites", label: "Actualités" },
  { href: "/culture", label: "Culture" },
  { href: "/divertissement", label: "Divertissement" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
  { href: "/recherche", label: "Recherche" },
];

export function SiteHeader({ headlines }: { headlines: BreakingHeadline[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="topline">
        <div className="shell topline-inner">
          <strong><i /> DERNIÈRE MINUTE</strong>
          <div className="ticker-window">
            <div className="ticker">
              {[...headlines, ...headlines].map((headline, index) => (
                <Link key={`${headline.text}-${index}`} href={headline.href}>
                  {headline.text}
                  <i aria-hidden="true">•</i>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" className="brand" aria-label="Voice of Guinea, accueil">
            <Image src="/brand/logo.svg" alt="Voice of Guinea" width={150} height={76} priority />
          </Link>
          <button
            className="menu-button"
            type="button"
            aria-expanded={open}
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={open ? "nav open" : "nav"} aria-label="Navigation principale">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${pathname === link.href ? "active" : ""}${link.href === "/recherche" ? " nav-search" : ""}`}
                aria-label={link.href === "/recherche" ? "Rechercher" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.href === "/recherche" ? (
                  <>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="6.5" />
                      <path d="m16 16 4 4" />
                    </svg>
                    <span className="sr-only">Recherche</span>
                  </>
                ) : link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
