import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";

const statusLabel: Record<string, string> = {
  in_review: "À relire",
  needs_changes: "À corriger",
  scheduled: "Programmé",
};

export default async function AnalyticsPage() {
  const newsroom = await getNewsroomUser();
  if (newsroom?.profile?.role !== "owner") redirect("/admin");

  const [categories, articles, authors, subscribers, activity] = await Promise.all([
    newsroom.supabase.from("categories").select("id, name, articles(count)").eq("active", true).order("display_order"),
    newsroom.supabase.from("articles").select("id, title, status, updated_at, categories(name), profiles!articles_author_id_fkey(full_name)"),
    newsroom.supabase.from("profiles").select("id, full_name, articles(count)").eq("active", true),
    newsroom.supabase.from("newsletter_subscribers").select("status"),
    newsroom.supabase.from("activity_log").select("id", { count: "exact", head: true }),
  ]);
  const allArticles = articles.data ?? [];
  const published = allArticles.filter((article) => article.status === "published").length;
  const reviewQueue = allArticles.filter((article) => ["in_review", "needs_changes", "scheduled"].includes(article.status));
  const confirmedSubscribers = (subscribers.data ?? []).filter((subscriber) => subscriber.status === "active").length;

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Direction</span><h1>Pilotage</h1><p>Le tableau privé de la rédaction : production, équipe, abonnés et suivi des changements.</p></div>
        <span className="period-pill">Accès propriétaire</span>
      </header>
      <section className="admin-stats analytics-summary">
        <article><span>À décider</span><strong>{allArticles.filter((article) => article.status === "in_review").length}</strong><small>Articles à relire</small></article>
        <article><span>À corriger</span><strong>{allArticles.filter((article) => article.status === "needs_changes").length}</strong><small>Retours en attente</small></article>
        <article><span>Abonnés confirmés</span><strong>{confirmedSubscribers}</strong><small>Audience newsletter</small></article>
        <article><span>Changements suivis</span><strong>{activity.count ?? 0}</strong><small>Journal d’audit</small></article>
      </section>
      <div className="analytics-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Répartition</span><h2>Articles par catégorie</h2></div></div>
          <div className="category-breakdown">{(categories.data ?? []).map((category) => <div key={category.id}><span>{category.name}</span><strong>{category.articles?.[0]?.count ?? 0}</strong></div>)}</div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Production</span><h2>Contributions de l’équipe</h2></div></div>
          <div className="category-breakdown">{(authors.data ?? []).map((author) => <div key={author.id}><span>{author.full_name || "Membre de la rédaction"}</span><strong>{author.articles?.[0]?.count ?? 0}</strong></div>)}</div>
        </section>
      </div>
      <section className="admin-panel editorial-queue owner-queue">
        <div className="admin-panel-heading"><div><span className="admin-kicker">Décisions à venir</span><h2>Suivi de publication</h2><p>{published} article{published > 1 ? "s" : ""} déjà publié{published > 1 ? "s" : ""}, et {reviewQueue.length} élément{reviewQueue.length > 1 ? "s" : ""} dans le circuit.</p></div></div>
        {reviewQueue.length ? <div className="queue-list">{reviewQueue.slice(0, 8).map((article) => <div className="queue-row" key={article.id}><div><strong>{article.title}</strong><span>{article.categories?.[0]?.name ?? "Sans catégorie"} · {article.profiles?.[0]?.full_name ?? "La rédaction"}</span></div><span className={`status ${article.status}`}>{statusLabel[article.status]}</span></div>)}</div> : <div className="admin-empty compact"><p>Aucun article n’attend une décision éditoriale.</p></div>}
      </section>
    </>
  );
}
