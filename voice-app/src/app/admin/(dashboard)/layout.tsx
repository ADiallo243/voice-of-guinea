import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getNewsroomUser } from "@/lib/supabase/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseConfig()) {
    return (
      <div className="admin-setup">
        <div>
          <span className="admin-kicker">Backend — étape 1</span>
          <h1>Connectons votre projet Supabase.</h1>
          <p>La structure sécurisée de la base et le dashboard sont prêts. Il reste à créer votre projet Supabase et à ajouter ses deux clés publiques.</p>
          <ol>
            <li>Créer un projet gratuit sur Supabase.</li>
            <li>Exécuter la migration SQL fournie.</li>
            <li>Copier l’URL et la clé publique dans <code>.env.local</code>.</li>
            <li>Créer votre compte administrateur.</li>
          </ol>
          <Link href="/admin/login">Voir l’écran de connexion →</Link>
        </div>
      </div>
    );
  }

  const newsroom = await getNewsroomUser();
  if (!newsroom?.profile?.role) {
    return (
      <AdminShell name={newsroom?.user.email}>
        <div className="admin-access-denied">
          <span className="admin-kicker">Compte en attente</span>
          <h1>Votre compte n’a pas encore de rôle.</h1>
          <p>Un propriétaire doit vous attribuer le rôle auteur, éditeur ou propriétaire dans Supabase.</p>
        </div>
      </AdminShell>
    );
  }

  return <AdminShell name={newsroom.profile.full_name || newsroom.user.email} role={newsroom.profile.role}>{children}</AdminShell>;
}
