import Link from "next/link";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import {
  deleteNewsletterSubscriber,
  updateNewsletterSubscriber,
} from "../actions";

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
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const newsroom = await getNewsroomUser();
  if (
    !newsroom?.profile?.role ||
    !["owner", "editor"].includes(newsroom.profile.role)
  )
    redirect("/admin");
  const { q = "", status = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Math.floor(Number(page) || 1));
  let query = newsroom!.supabase
    .from("newsletter_subscribers")
    .select(
      "id, email, status, source, consent_at, confirmed_at, unsubscribed_at, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * 50, currentPage * 50 - 1);
  if (q.trim()) query = query.ilike("email", `%${q.trim()}%`);
  if (["active", "pending", "unsubscribed"].includes(status))
    query = query.eq("status", status);

  const [
    { data, error, count },
    activeResult,
    pendingResult,
    unsubResult,
    recentResult,
  ] = await Promise.all([
    query,
    ...["active", "pending", "unsubscribed"].map((value) =>
      newsroom!.supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", value),
    ),
    newsroom!.supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", daysAgo(30)),
  ]);
  const subscribers = data ?? [];
  const active = activeResult.count ?? "—",
    pending = pendingResult.count ?? "—",
    unsubscribed = unsubResult.count ?? "—",
    recent = recentResult.count ?? "—";
  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">Audience directe</span>
          <h1>Newsletter</h1>
          <p>
            Suivez les inscriptions, confirmations et désabonnements de votre
            audience.
          </p>
        </div>
        <span className="period-pill">Inscription directe activée</span>
      </header>

      {error && (
        <div className="admin-config-warning">
          <strong>La liste des abonnés est momentanément indisponible.</strong>
          <p>
            Réessayez et consultez le panneau Système avant de conclure que la
            liste est vide.
          </p>
        </div>
      )}

      <section className="admin-stats newsletter-stats">
        <article>
          <span>Abonnés actifs</span>
          <strong>{active}</strong>
          <small>Adresses confirmées</small>
        </article>
        <article>
          <span>À confirmer</span>
          <strong>{pending}</strong>
          <small>Confirmation en attente</small>
        </article>
        <article>
          <span>Désabonnés</span>
          <strong>{unsubscribed}</strong>
          <small>Ne recevront plus d’e-mails</small>
        </article>
        <article>
          <span>Nouveaux — 30 jours</span>
          <strong>{recent}</strong>
          <small>Toutes les inscriptions</small>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-kicker">Contacts</span>
            <h2>{count ?? "—"} adresse(s) correspondant au filtre</h2>
          </div>
        </div>
        <form className="admin-toolbar">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher une adresse e-mail…"
          />
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
                    Inscrit le{" "}
                    {new Date(subscriber.created_at).toLocaleDateString(
                      "fr-FR",
                    )}
                    {" · "}
                    {subscriber.source === "website"
                      ? "Site public"
                      : subscriber.source}
                  </span>
                </div>
                <span className={`status ${subscriber.status}`}>
                  {statusLabel[subscriber.status]}
                </span>
                {subscriber.status !== "unsubscribed" ? (
                  <form
                    action={updateNewsletterSubscriber}
                    className="subscriber-actions"
                  >
                    <input type="hidden" name="id" value={subscriber.id} />
                    <input type="hidden" name="status" value="unsubscribed" />
                    <button className="text-button" type="submit">
                      Désabonner
                    </button>
                  </form>
                ) : (
                  <span className="subscriber-locked">Choix respecté</span>
                )}
                {newsroom?.profile?.role === "owner" && (
                  <ConfirmSubmit
                    action={deleteNewsletterSubscriber}
                    message="Supprimer définitivement cette adresse de la base ? Cette action ne peut pas être annulée."
                    className="danger-link"
                    field={{ name: "id", value: subscriber.id }}
                  >
                    Supprimer
                  </ConfirmSubmit>
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
      <nav className="pagination" aria-label="Pagination des abonnés">
        {currentPage > 1 && (
          <Link
            href={`?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&page=${currentPage - 1}`}
          >
            Précédente
          </Link>
        )}
        <span>Page {currentPage}</span>
        {currentPage * 50 < (count || 0) && (
          <Link
            href={`?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&page=${currentPage + 1}`}
          >
            Suivante
          </Link>
        )}
      </nav>
    </>
  );
}
