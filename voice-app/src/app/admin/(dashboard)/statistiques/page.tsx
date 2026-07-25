import { getNewsroomUser } from "@/lib/supabase/admin";

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  const newsroom = await getNewsroomUser();
  const [views, categories, articles, authors] = await Promise.all([
    newsroom!.supabase.from("article_daily_views").select("viewed_on, views, article_id, articles(title)").gte("viewed_on", isoDaysAgo(30)).order("viewed_on"),
    newsroom!.supabase.from("categories").select("id, name, articles(count)").eq("active", true).order("display_order"),
    newsroom!.supabase.from("articles").select("id, status, published_at").gte("created_at", `${isoDaysAgo(30)}T00:00:00Z`),
    newsroom!.supabase.from("profiles").select("id, full_name, articles(count)").eq("active", true),
  ]);

  const daily = new Map<string, number>();
  const byArticle = new Map<string, { title: string; views: number }>();
  for (const row of views.data ?? []) {
    daily.set(row.viewed_on, (daily.get(row.viewed_on) ?? 0) + Number(row.views));
    const current = byArticle.get(row.article_id) ?? { title: row.articles?.[0]?.title || "Article", views: 0 };
    current.views += Number(row.views);
    byArticle.set(row.article_id, current);
  }
  const last7 = [...daily.entries()].filter(([date]) => date >= isoDaysAgo(7)).reduce((sum, [, count]) => sum + count, 0);
  const previous7 = [...daily.entries()].filter(([date]) => date >= isoDaysAgo(14) && date < isoDaysAgo(7)).reduce((sum, [, count]) => sum + count, 0);
  const trend = previous7 ? Math.round(((last7 - previous7) / previous7) * 100) : 0;
  const chartDays = Array.from({ length: 14 }, (_, index) => isoDaysAgo(13 - index));
  const maxViews = Math.max(1, ...chartDays.map((day) => daily.get(day) ?? 0));
  const topArticles = [...byArticle.values()].sort((a, b) => b.views - a.views).slice(0, 5);
  const publishedThisMonth = (articles.data ?? []).filter((article) => article.status === "published").length;

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Performance</span><h1>Statistiques</h1><p>Comprenez ce qui est publié, lu et produit par la rédaction.</p></div>
        <span className="period-pill">30 derniers jours</span>
      </header>
      <section className="admin-stats analytics-summary">
        <article><span>Lectures — 7 jours</span><strong>{last7.toLocaleString("fr-FR")}</strong><small className={trend >= 0 ? "positive" : "negative"}>{trend >= 0 ? "+" : ""}{trend}% vs. semaine précédente</small></article>
        <article><span>Publications — 30 jours</span><strong>{publishedThisMonth}</strong><small>Articles mis en ligne</small></article>
        <article><span>En préparation</span><strong>{(articles.data ?? []).filter((article) => article.status === "draft").length}</strong><small>Brouillons actuels</small></article>
        <article><span>Équipe active</span><strong>{authors.data?.length ?? 0}</strong><small>Propriétaires, éditeurs et auteurs</small></article>
      </section>
      <div className="analytics-grid">
        <section className="admin-panel chart-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Audience</span><h2>Lectures quotidiennes</h2></div></div>
          <div className="bar-chart">
            {chartDays.map((day) => {
              const count = daily.get(day) ?? 0;
              return <div key={day} title={`${day}: ${count} lectures`}><span style={{ height: `${Math.max(3, (count / maxViews) * 100)}%` }} /><small>{new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric" })}</small></div>;
            })}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Contenu</span><h2>Articles les plus lus</h2></div></div>
          {topArticles.length ? <ol className="ranking-list">{topArticles.map((article) => <li key={article.title}><span>{article.title}</span><strong>{article.views.toLocaleString("fr-FR")}</strong></li>)}</ol> : <div className="admin-empty compact"><p>Les lectures apparaîtront lorsque le site public utilisera les articles Supabase.</p></div>}
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Répartition</span><h2>Articles par catégorie</h2></div></div>
          <div className="category-breakdown">{(categories.data ?? []).map((category) => <div key={category.id}><span>{category.name}</span><strong>{category.articles?.[0]?.count ?? 0}</strong></div>)}</div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Production</span><h2>Contributions de l’équipe</h2></div></div>
          <div className="category-breakdown">{(authors.data ?? []).map((author) => <div key={author.id}><span>{author.full_name || "Membre de la rédaction"}</span><strong>{author.articles?.[0]?.count ?? 0}</strong></div>)}</div>
        </section>
      </div>
    </>
  );
}
