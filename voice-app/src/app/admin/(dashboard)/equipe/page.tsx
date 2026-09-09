import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { createSupabaseAdminClient, hasSupabaseSecret } from "@/lib/supabase/admin-client";
import { inviteTeamMember, updateTeamMember } from "../actions";

const roleLabel: Record<string, string> = {
  owner: "Propriétaire",
  editor: "Éditeur",
  author: "Auteur",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; email?: string }>;
}) {
  const newsroom = await getNewsroomUser();
  if (newsroom?.profile?.role !== "owner") redirect("/admin");
  const { invite, email } = await searchParams;
  const secretReady = hasSupabaseSecret();
  const { data: profiles } = await newsroom.supabase
    .from("profiles")
    .select("id, full_name, role, active, created_at")
    .order("created_at");
  const users = secretReady ? (await createSupabaseAdminClient().auth.admin.listUsers()).data.users : [];

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Accès & permissions</span><h1>Équipe</h1><p>Invitez vos collaborateurs et contrôlez précisément leurs droits.</p></div>
      </header>
      {invite === "sent" && <p className="admin-flash success" role="status">Invitation envoyée à {email || "ce nouveau membre"}. La personne choisira son mot de passe depuis l’e-mail reçu.</p>}
      {!secretReady && (
        <div className="admin-config-warning">
          <strong>Une dernière clé serveur est nécessaire pour envoyer des invitations.</strong>
          <p>Ajoutez <code>SUPABASE_SECRET_KEY</code> dans <code>.env.local</code>. Cette clé reste uniquement sur votre Mac et le serveur.</p>
        </div>
      )}
      <div className="team-layout">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Membres</span><h2>{profiles?.length ?? 0} compte(s)</h2></div></div>
          <div className="team-list">
            {(profiles ?? []).map((profile) => {
              const authUser = users.find((user) => user.id === profile.id);
              return (
                <details className="team-member" key={profile.id}>
                  <summary>
                    <span className="team-avatar">{(profile.full_name || authUser?.email || "?").slice(0, 1).toUpperCase()}</span>
                    <div><strong>{profile.full_name || "Nom à compléter"}</strong><span>{authUser?.email || "Adresse masquée sans clé serveur"}</span></div>
                    <span className={`status ${profile.active ? "active" : "archived"}`}>{profile.active ? roleLabel[profile.role] || "En attente" : "Suspendu"}</span>
                  </summary>
                  <form action={updateTeamMember} className="team-edit-form">
                    <input type="hidden" name="id" value={profile.id} />
                    <label>Rôle<select name="role" defaultValue={profile.role ?? "author"}><option value="owner">Propriétaire</option><option value="editor">Éditeur</option><option value="author">Auteur</option></select></label>
                    <label className="check-row"><input name="active" type="checkbox" defaultChecked={profile.active} /> Accès actif</label>
                    <button className="admin-secondary" type="submit" disabled={!secretReady}>Mettre à jour</button>
                  </form>
                </details>
              );
            })}
          </div>
        </section>
        <section className="admin-panel invite-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Nouveau membre</span><h2>Envoyer une invitation</h2></div></div>
          <form action={inviteTeamMember} className="category-form">
            <label>Nom complet<input name="fullName" required placeholder="Prénom et nom" /></label>
            <label>Adresse e-mail<input name="email" type="email" required placeholder="nom@exemple.com" /></label>
            <label>Rôle<select name="role" defaultValue="author"><option value="author">Auteur — brouillons personnels</option><option value="editor">Éditeur — publication et gestion</option></select></label>
            <div className="role-help"><strong>Auteur</strong><span>Écrit et modifie uniquement ses propres brouillons.</span><strong>Éditeur</strong><span>Relit, publie et gère tous les contenus.</span></div>
            <button className="admin-primary" type="submit" disabled={!secretReady}>Envoyer l’invitation</button>
          </form>
        </section>
      </div>
    </>
  );
}
