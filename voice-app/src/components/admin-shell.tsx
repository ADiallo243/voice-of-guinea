"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/admin/actions";

const adminLinks = [
  { href: "/admin", label: "Vue d’ensemble", icon: "⌂" },
  { href: "/admin/articles", label: "Articles", icon: "▤" },
  { href: "/admin/breaking-news", label: "Dernière minute", icon: "●" },
  { href: "/admin/categories", label: "Catégories", icon: "◇" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "✉", editorOnly: true },
  { href: "/admin/statistiques", label: "Pilotage", icon: "↗", ownerOnly: true },
  { href: "/admin/equipe", label: "Équipe", icon: "◎", ownerOnly: true },
];

export function AdminShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name?: string;
  role?: string | null;
}) {
  const pathname = usePathname();
  const displayName = name || "Administrateur";
  const roleLabel = role === "owner" ? "Propriétaire" : role === "editor" ? "Éditeur" : "Auteur";

  return (
    <div className="admin-frame">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <Image src="/brand/logo.svg" alt="Voice of Guinea" width={92} height={48} />
          <span>Rédaction</span>
        </Link>
        <nav aria-label="Navigation de la rédaction">
          {adminLinks
            .filter((link) => !link.ownerOnly || role === "owner")
            .filter((link) => !link.editorOnly || role === "owner" || role === "editor")
            .map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              <i>{link.icon}</i>
              {link.label}
            </Link>
            ))}
        </nav>
        <div className="admin-account">
          <span className="admin-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
          <form action={signOut} title="Se déconnecter">
            <button type="submit" aria-label="Se déconnecter">↗</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
