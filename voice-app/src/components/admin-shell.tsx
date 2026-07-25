import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/admin/actions";

const adminLinks = [
  { href: "/admin", label: "Vue d’ensemble", icon: "⌂" },
  { href: "/admin/articles", label: "Articles", icon: "▤" },
  { href: "/admin/breaking-news", label: "Dernière minute", icon: "●" },
  { href: "/admin/categories", label: "Catégories", icon: "◇" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "✉" },
  { href: "/admin/statistiques", label: "Statistiques", icon: "↗" },
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
  return (
    <div className="admin-frame">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <Image src="/brand/logo.svg" alt="Voice of Guinea" width={92} height={48} />
          <span>Newsroom</span>
        </Link>
        <nav>
          {adminLinks.filter((link) => !link.ownerOnly || role === "owner").map((link) => (
            <Link href={link.href} key={link.href}>
              <i>{link.icon}</i>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-account">
          <span>{name || "Administrateur"}</span>
          <form action={signOut}>
            <button type="submit">Se déconnecter</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
