import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { createSupabaseAdminClient, hasSupabaseSecret } from "@/lib/supabase/admin-client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type Check = {
  label: string;
  detail: string;
  ready: boolean;
};

function environmentCheck(label: string, detail: string, names: string[]): Check {
  return { label, detail, ready: names.every((name) => Boolean(process.env[name])) };
}

async function databaseReadiness() {
  if (!hasSupabaseSecret()) return { editorial: false, newsletter: false, login: false };

  try {
    const admin = createSupabaseAdminClient();
    const [editorial, newsletter, login] = await Promise.all([
      admin.from("article_revisions").select("id", { count: "exact", head: true }),
      admin.from("newsletter_signup_limits").select("attempt_key", { count: "exact", head: true }),
      admin.from("login_attempt_limits").select("attempt_key", { count: "exact", head: true }),
    ]);
    return {
      editorial: !editorial.error,
      newsletter: !newsletter.error,
      login: !login.error,
    };
  } catch {
    return { editorial: false, newsletter: false, login: false };
  }
}

function CheckGroup({ title, eyebrow, checks }: { title: string; eyebrow: string; checks: Check[] }) {
  return (
    <section className="admin-panel system-panel">
      <div className="admin-panel-heading">
        <div><span className="admin-kicker">{eyebrow}</span><h2>{title}</h2></div>
      </div>
      <div className="system-checks">
        {checks.map((check) => (
          <article key={check.label} className="system-check">
            <span className={`system-indicator ${check.ready ? "ready" : "missing"}`} aria-hidden="true" />
            <div><strong>{check.label}</strong><p>{check.detail}</p></div>
            <span className={`system-state ${check.ready ? "ready" : "missing"}`}>{check.ready ? "Prêt" : "À terminer"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function SystemPage() {
  const newsroom = await getNewsroomUser();
  if (newsroom?.profile?.role !== "owner") redirect("/admin");

  const database = await databaseReadiness();
  const core: Check[] = [
    { label: "Connexion publique Supabase", detail: "Lecture sécurisée du contenu public et authentification.", ready: hasSupabaseConfig() },
    { label: "Clé serveur Supabase", detail: "Invitations, newsletter et tâches internes côté serveur.", ready: hasSupabaseSecret() },
    { label: "Workflow éditorial", detail: "Historique des versions et journal de la rédaction installés.", ready: database.editorial },
    { label: "Protection de publication", detail: "Migration 012 : contrôle des articles et limitation des connexions.", ready: database.login },
  ];
  const publishing: Check[] = [
    environmentCheck("Adresse officielle du site", "URL utilisée dans les liens sécurisés et les e-mails.", ["NEXT_PUBLIC_SITE_URL"]),
    environmentCheck("Publication programmée", "Secret protégeant la tâche quotidienne Vercel.", ["CRON_SECRET"]),
    environmentCheck("Service e-mail", "Compte Resend utilisé pour les messages transactionnels.", ["RESEND_API_KEY"]),
    environmentCheck("Pack réseaux sociaux", "Adresses d’expédition et de réception configurées.", ["SOCIAL_PACK_FROM_EMAIL", "SOCIAL_PACK_TO_EMAIL"]),
  ];
  const protection: Check[] = [
    environmentCheck("Widget anti-spam", "Clé publique et clé secrète Cloudflare Turnstile.", ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]),
    { label: "Limitation newsletter", detail: "Secret HMAC et table de limitation persistante.", ready: Boolean(process.env.NEWSLETTER_RATE_LIMIT_SECRET) && database.newsletter },
    { label: "Limitation des connexions", detail: "Secret HMAC et migration 012 actifs.", ready: Boolean(process.env.AUTH_RATE_LIMIT_SECRET) && database.login },
    environmentCheck("Envoi newsletter", "Adresse d’expédition vérifiée pour le double consentement.", ["NEWSLETTER_FROM_EMAIL"]),
  ];
  const allChecks = [...core, ...publishing, ...protection];
  const readyCount = allChecks.filter((check) => check.ready).length;

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Exploitation</span><h1>Système</h1><p>La santé des connexions essentielles, sans jamais afficher vos clés secrètes.</p></div>
        <span className="period-pill">Accès propriétaire</span>
      </header>
      <section className="system-summary admin-panel">
        <div><span className="admin-kicker">État de préparation</span><strong>{readyCount}/{allChecks.length}</strong></div>
        <p>{readyCount === allChecks.length ? "Tous les services vérifiables sont prêts." : "Terminez les éléments orange dans Vercel ou Supabase, puis redéployez."}</p>
      </section>
      <div className="system-grid">
        <CheckGroup eyebrow="Socle" title="Base de données" checks={core} />
        <CheckGroup eyebrow="Diffusion" title="Publication & e-mail" checks={publishing} />
        <CheckGroup eyebrow="Défense" title="Anti-abus" checks={protection} />
        <section className="admin-panel system-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Vérification manuelle</span><h2>Comptes & accès</h2></div></div>
          <div className="system-guidance">
            <p><strong>Supabase Auth :</strong> ajoutez <code>https://www.voiceofguinea.com/auth/callback</code> aux URL de redirection et désactivez les inscriptions publiques.</p>
            <p><strong>Équipe :</strong> activez la MFA pour chaque propriétaire et éditeur, et désactivez immédiatement tout compte qui quitte la rédaction.</p>
            <p><strong>Plateformes :</strong> activez la double authentification sur GitHub, Vercel, Supabase, Google et Resend.</p>
          </div>
        </section>
      </div>
    </>
  );
}
