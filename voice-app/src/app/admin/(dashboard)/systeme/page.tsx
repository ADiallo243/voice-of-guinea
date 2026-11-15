import Link from "next/link";
import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { hasSupabaseSecret } from "@/lib/supabase/admin-client";
import { checkDuePublications } from "../actions";
import { newsroomDate } from "@/lib/newsroom";
export default async function SystemPage() {
  const room = await getNewsroomUser();
  if (room?.profile?.role !== "owner") redirect("/admin");
  const [
    { data: health, error: healthError },
    { data: runs, error: runError },
    { data: overdue },
  ] = await Promise.all([
    room.supabase.rpc("newsroom_health"),
    room.supabase
      .from("publication_runs")
      .select("id,started_at,finished_at,status,published_count,error_note")
      .order("started_at", { ascending: false })
      .limit(10),
    room.supabase
      .from("articles")
      .select("id,title,scheduled_for")
      .eq("status", "scheduled")
      .lt("scheduled_for", new Date().toISOString()),
  ]);
  const checks = [
    {
      name: "Notes éditoriales privées",
      ok: health?.private_notes,
      detail:
        "Permissions anonymes et authentifiées vérifiées dans PostgreSQL.",
    },
    {
      name: "Garde de publication",
      ok: health?.publication_trigger,
      detail: "Présence du trigger de validation vérifiée dans PostgreSQL.",
    },
    {
      name: "Double authentification de votre compte",
      ok: health?.mfa_enabled,
      detail:
        "Facteur vérifié dans Supabase Auth ; activation à effectuer personnellement.",
    },
  ];
  const config = [
    ["Clé serveur Supabase", hasSupabaseSecret()],
    ["Secret du cron", Boolean(process.env.CRON_SECRET)],
    ["Service e-mail Resend", Boolean(process.env.RESEND_API_KEY)],
    ["Expéditeur newsletter", Boolean(process.env.NEWSLETTER_FROM_EMAIL)],
    ["Limitation des connexions", Boolean(process.env.AUTH_RATE_LIMIT_SECRET)],
    [
      "Limitation newsletter",
      Boolean(process.env.NEWSLETTER_RATE_LIMIT_SECRET),
    ],
    [
      "Widget Turnstile",
      Boolean(
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
        process.env.TURNSTILE_SECRET_KEY,
      ),
    ],
  ] as const;
  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">Exploitation</span>
          <h1>Système</h1>
          <p>
            Les preuves de fonctionnement sont distinguées de la simple présence
            de configuration.
          </p>
        </div>
        <Link href="/admin/securite" className="admin-secondary">
          Sécuriser mon compte
        </Link>
      </header>
      {healthError && (
        <p role="alert">
          Les contrôles de sécurité ne répondent pas : état inconnu, pas validé.
        </p>
      )}
      <section className="admin-panel">
        <h2>Contrôles vérifiés</h2>
        {checks.map((c) => (
          <article className="system-check" key={c.name}>
            <div>
              <strong>{c.name}</strong>
              <p>{c.detail}</p>
            </div>
            <span className={`status ${c.ok ? "active" : "needs_changes"}`}>
              {c.ok ? "Vérifié" : "À traiter"}
            </span>
          </article>
        ))}
      </section>
      <section className="admin-panel">
        <h2>Publication programmée</h2>
        <p>
          Un seul cron existant : chaque jour à 06 h UTC. En novembre : 01 h
          America/Toronto. L’heure réelle de publication peut différer de
          l’échéance ; elle est enregistrée au passage.
        </p>
        {Boolean(overdue?.length) && (
          <p role="alert">
            {overdue!.length} article(s) ont atteint leur échéance et attendent
            un passage.
          </p>
        )}
        <form action={checkDuePublications}>
          <button className="admin-secondary" type="submit">
            Contrôler et publier les échéances atteintes maintenant
          </button>
        </form>
        <p>
          Cette commande utilise exactement le même contrôle d’échéance que le
          cron. Elle ne publie pas les articles futurs.
        </p>
        {runError ? (
          <p role="alert">Journal des passages indisponible.</p>
        ) : runs?.length ? (
          <table className="publication-run-table">
            <thead>
              <tr>
                <th>Passage Toronto</th>
                <th>Résultat</th>
                <th>Articles publiés</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>{newsroomDate(r.started_at)}</td>
                  <td>
                    {r.status === "success"
                      ? "Réussi"
                      : r.status === "failed"
                        ? "Échec"
                        : "En cours"}{" "}
                    {r.error_note}
                  </td>
                  <td>{r.published_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>
            Aucun passage enregistré depuis l’installation du journal. Le secret
            du cron seul ne prouve pas son exécution.
          </p>
        )}
      </section>
      <section className="admin-panel">
        <h2>Configuration présente — fonctionnement à confirmer</h2>
        {config.map(([name, exists]) => (
          <p key={name}>
            <strong>{name} :</strong> {exists ? "Configuré" : "Non configuré"}
          </p>
        ))}
        <p>
          La présence d’une clé ne prouve pas la livraison d’un e-mail ni le
          fonctionnement du widget. Les limites persistantes protègent les
          formulaires même si Turnstile n’est pas configuré.
        </p>
      </section>
      <section className="admin-panel">
        <h2>Reprise et comptes</h2>
        <p>
          Activez la protection des mots de passe compromis dans Supabase Auth
          si votre offre la propose. Ne désactivez jamais la RLS pour résoudre
          un problème d’édition.
        </p>
        <p>
          Avant une restauration, vérifiez une sauvegarde et testez sa
          récupération dans un environnement séparé. Le journal de versions des
          articles permet de comparer et de restaurer un contenu en brouillon.
        </p>
      </section>
    </>
  );
}
