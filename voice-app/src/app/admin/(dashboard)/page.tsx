import Link from "next/link";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { importMigratedArticles } from "./actions";

const statusLabel: Record<string, string> = {
  published: "Publié",
  draft: "Brouillon",
  in_review: "À relire",
  needs_changes: "À corriger",
  scheduled: "Programmé",
  archived: "Archivé",
};

export default async function AdminDashboard() {
  const newsroom = await getNewsroomUser();
  const [published, drafts, scheduled, breaking, recent, queue, activity] = await Promise.all([
    newsroom!.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    newsroom!.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    newsroom!.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    newsroom!.supabase.from("breaking_news").select("*", { count: "exact", head: true }).eq("active", true),
    newsroom!.supabase.from("articles").select("id, title, status, created_at, categories(name)").order("created_at", { ascending: false }).limit(6),
    newsroom!.supabase.from("articles").select("id, title, status, updated_at, categories(name), profiles(full_name)").in("status", ["in_review", "needs_changes", "scheduled"]).order("updated_at", { ascending: false }).limit(6),
    newsroom!.supabase.from("activity_log").select("id, action, entity_type, entity_id, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
  ]);
  const articleActivityIds = (activity.data ?? []).filter((item) => item.entity_type === "articles" && item.entity_id).map((item) => item.entity_id);
  const activityArticles = articleActivityIds.length
    ? await newsroom!.supabase.from("articles").select("id, title").in("id", articleActivityIds)
    : { data: [] };
  const articleTitles = new Map((activityArticles.data ?? []).map((article) => [article.id, article.title]));

  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">Vue d’ensemble</span>
          <h1>Bonjour, la rédaction.</h1>
          <p>Les données importantes de Voice of Guinea, en un coup d’œil.</p>
        </div>
        <Link href="/admin/articles/new" className="admin-primary">+ Nouvel article</Link>
      </header>
      <section className="admin-stats">
        <article><span>Articles publiés</span><strong>{published.count ?? 0}</strong><small>Contenus en ligne</small></article>
        <article><span>Brouillons</span><strong>{drafts.count ?? 0}</strong><small>À finaliser</small></article>
        <article><span>Programmés</span><strong>{scheduled.count ?? 0}</strong><small>À venir</small></article>
        <article><span>Dernière minute</span><strong>{breaking.count ?? 0}</strong><small>Éléments actifs</small></article>
      </section>
      <section className="admin-panel editorial-queue">
        <div className="admin-panel-heading">
          <div><span className="admin-kicker">Workflow</span><h2>File de publication</h2><p>Les articles à relire, corriger ou programmer, réunis au même endroit.</p></div>
          <Link href="/admin/articles?status=in_review">Voir les articles →</Link>
        </div>
        {queue.data?.length ? (
          <div className="queue-list">
            {queue.data.map((article) => (
              <div className="queue-row" key={article.id}>
                <div><strong>{article.title}</strong><span>{article.categories?.[0]?.name ?? "Sans catégorie"} · {article.profiles?.[0]?.full_name ?? "La rédaction"}</span></div>
                <span className={`status ${article.status}`}>{statusLabel[article.status]}</span>
                <Link href={`/admin/articles/${article.id}/edit`}>Ouvrir</Link>
              </div>
            ))}
          </div>
        ) : <div className="admin-empty compact"><p>La file est vide : rien n’attend une décision éditoriale.</p></div>}
      </section>
      <div className="dashboard-columns">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-kicker">Contenu</span><h2>Articles récents</h2></div>
            <Link href="/admin/articles">Tout gérer →</Link>
          </div>
          {recent.data?.length ? (
            <div className="admin-table">
              {recent.data.map((article) => (
                <div className="admin-table-row" key={article.id}>
                  <div><strong>{article.title}</strong><span>{article.categories?.[0]?.name ?? "Sans catégorie"}</span></div>
                  <span className={`status ${article.status}`}>{statusLabel[article.status]}</span>
                  <Link href={`/admin/articles/${article.id}/edit`}>Modifier</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <strong>Votre base d’articles est prête.</strong>
              <p>Importez maintenant les cinq articles du site existant.</p>
              {newsroom?.profile?.role === "owner" && <form action={importMigratedArticles}><button type="submit" className="admin-secondary">Importer les articles</button></form>}
            </div>
          )}
        </section>
        <section className="admin-panel activity-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Équipe</span><h2>Activité récente</h2></div></div>
          {activity.data?.length ? (
            <div className="activity-list">
              {activity.data.map((item) => (
                <div key={item.id}><i /><p><strong>{item.profiles?.[0]?.full_name || "La rédaction"}</strong> {item.action === "insert" ? "a créé" : item.action === "delete" ? "a supprimé" : "a mis à jour"} {item.entity_type === "articles" ? `l’article « ${articleTitles.get(item.entity_id) ?? "contenu supprimé"} »` : item.entity_type === "categories" ? "une catégorie" : item.entity_type === "breaking_news" ? "la dernière minute" : item.entity_type === "profiles" ? "un accès équipe" : "la newsletter"}.</p><time>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</time></div>
              ))}
            </div>
          ) : <div className="admin-empty compact"><p>L’activité apparaîtra après la prochaine migration.</p></div>}
        </section>
      </div>
    </>
  );
}
