import { getNewsroomUser } from "@/lib/supabase/admin";

export default async function AnalyticsPage() {
  const newsroom = await getNewsroomUser();
  const [categories, articles, authors] = await Promise.all([
    newsroom!.supabase.from("categories").select("id, name, articles(count)").eq("active", true).order("display_order"),
    newsroom!.supabase.from("articles").select("id, status, published_at"),
    newsroom!.supabase.from("profiles").select("id, full_name, articles(count)").eq("active", true),
  ]);
  const published = (articles.data ?? []).filter((article) => article.status === "published").length;

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Performance</span><h1>Statistiques</h1><p>Suivez la production éditoriale ici et l’audience fiable dans Google Analytics.</p></div>
        <a className="period-pill" href="https://analytics.google.com/" target="_blank" rel="noreferrer">Ouvrir Google Analytics</a>
      </header>
      <section className="admin-stats analytics-summary">
        <article><span>Articles publiés</span><strong>{published}</strong><small>Contenus en ligne</small></article>
        <article><span>En préparation</span><strong>{(articles.data ?? []).filter((article) => article.status === "draft").length}</strong><small>Brouillons actuels</small></article>
        <article><span>Équipe active</span><strong>{authors.data?.length ?? 0}</strong><small>Propriétaires, éditeurs et auteurs</small></article>
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
    </>
  );
}
