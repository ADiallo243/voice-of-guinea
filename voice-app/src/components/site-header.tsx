"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/actualites", label: "Actualités" },
  { href: "/culture", label: "Culture" },
  { href: "/divertissement", label: "Divertissement" },
  { href: "/a-propos", label: "À propos" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="topline">
        <div className="shell topline-inner">
          <span>Conakry, Guinée</span>
          <span>L’information qui nous rassemble</span>
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
                className={pathname === link.href ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="newsline">
        <div className="shell newsline-inner">
          <strong>À LA UNE</strong>
          <span>La Guinée racontée d’ici, avec contexte et proximité.</span>
        </div>
      </div>
    </>
  );
}
