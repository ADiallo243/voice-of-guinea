import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { deleteNewsletterSubscriber, updateNewsletterSubscriber } from "../actions";

const statusLabel: Record<string, string> = {
  active: "Actif",
  pending: "À confirmer",
  unsubscribed: "Désabonné",
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export default async function NewsletterAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const newsroom = await getNewsroomUser();
  if (!newsroom?.profile?.role || !["owner", "editor"].includes(newsroom.profile.role)) redirect("/admin");
  const { q = "", status = "" } = await searchParams;
  let query = newsroom!.supabase
    .from("newsletter_subscribers")
    .select("id, email, status, source, consent_at, confirmed_at, unsubscribed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(250);
  if (q.trim()) query = query.ilike("email", `%${q.trim()}%`);
  if (["active", "pending", "unsubscribed"].includes(status)) query = query.eq("status", status);

  const { data, error } = await query;
  const subscribers = data ?? [];
  const active = subscribers.filter((subscriber) => subscriber.status === "active").length;
  const pending = subscribers.filter((subscriber) => subscriber.status === "pending").length;
  const unsubscribed = subscribers.filter((subscriber) => subscriber.status === "unsubscribed").length;
  const recent = subscribers.filter((subscriber) => subscriber.created_at >= daysAgo(30)).length;

  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">Audience directe</span>
          <h1>Newsletter</h1>
          <p>Suivez les inscriptions, confirmations et désabonnements de votre audience.</p>
        </div>
        <span className="period-pill">Double confirmation activée</span>
      </header>

      {error && (
        <div className="admin-config-warning">
          <strong>La table newsletter n’est pas encore installée dans Supabase.</strong>
          <p>Exécutez la migration <code>004_newsletter.sql</code> avant la mise en ligne.</p>
        </div>
      )}

      <section className="admin-stats newsletter-stats">
        <article><span>Abonnés actifs</span><strong>{active}</strong><small>Adresses confirmées</small></article>
        <article><span>À confirmer</span><strong>{pending}</strong><small>Confirmation en attente</small></article>
        <article><span>Désabonnés</span><strong>{unsubscribed}</strong><small>Ne recevront plus d’e-mails</small></article>
        <article><span>Nouveaux — 30 jours</span><strong>{recent}</strong><small>Toutes les inscriptions</small></article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-kicker">Contacts</span><h2>{subscribers.length} adresse(s)</h2></div>
        </div>
        <form className="admin-toolbar">
          <input name="q" defaultValue={q} placeholder="Rechercher une adresse e-mail…" />
          <select name="status" defaultValue={status}>
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="pending">À confirmer</option>
            <option value="unsubscribed">Désabonnés</option>
          </select>
          <button type="submit">Filtrer</button>
        </form>
        {subscribers.length ? (
          <div className="subscriber-list">
            {subscribers.map((subscriber) => (
              <div className="subscriber-row" key={subscriber.id}>
                <div>
                  <strong>{subscriber.email}</strong>
                  <span>
                    Inscrit le {new Date(subscriber.created_at).toLocaleDateString("fr-FR")}
                    {" · "}{subscriber.source === "website" ? "Site public" : subscriber.source}
                  </span>
                </div>
                <span className={`status ${subscriber.status}`}>{statusLabel[subscriber.status]}</span>
                <form action={updateNewsletterSubscriber} className="subscriber-actions">
                  <input type="hidden" name="id" value={subscriber.id} />
                  <select name="status" defaultValue={subscriber.status}>
                    <option value="pending">À confirmer</option>
                    <option value="active">Actif</option>
                    <option value="unsubscribed">Désabonné</option>
                  </select>
                  <button className="text-button" type="submit">Mettre à jour</button>
                </form>
                {newsroom?.profile?.role === "owner" && (
                  <form action={deleteNewsletterSubscriber}>
                    <input type="hidden" name="id" value={subscriber.id} />
                    <button className="danger-link" type="submit">Supprimer</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            <strong>Aucun abonné pour le moment.</strong>
            <p>Les inscriptions confirmées et en attente apparaîtront ici.</p>
          </div>
        )}
      </section>
    </>
  );
}
