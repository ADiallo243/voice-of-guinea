import Link from "next/link";
import { articles as migratedArticles } from "@/lib/articles";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getNewsroomUser } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  let stats = {
    published: migratedArticles.length,
    drafts: 0,
    scheduled: 0,
    breaking: 4,
  };

  if (hasSupabaseConfig()) {
    const newsroom = await getNewsroomUser();
    if (newsroom?.profile?.role) {
      const [published, drafts, scheduled, breaking] = await Promise.all([
        newsroom.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
        newsroom.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
        newsroom.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
        newsroom.supabase.from("breaking_news").select("*", { count: "exact", head: true }).eq("active", true),
      ]);
      stats = {
        published: published.count ?? 0,
        drafts: drafts.count ?? 0,
        scheduled: scheduled.count ?? 0,
        breaking: breaking.count ?? 0,
      };
    }
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">Vue d’ensemble</span>
          <h1>Bonjour, la rédaction.</h1>
          <p>Voici l’activité de Voice of Guinea.</p>
        </div>
        <Link href="/admin/articles/new" className="admin-primary">+ Nouvel article</Link>
      </header>
      <section className="admin-stats">
        <article><span>Articles publiés</span><strong>{stats.published}</strong><small>Contenus en ligne</small></article>
        <article><span>Brouillons</span><strong>{stats.drafts}</strong><small>À finaliser</small></article>
        <article><span>Programmés</span><strong>{stats.scheduled}</strong><small>À venir</small></article>
        <article><span>Dernière minute</span><strong>{stats.breaking}</strong><small>Éléments actifs</small></article>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-kicker">Contenu</span><h2>Articles récents</h2></div>
          <Link href="/admin/articles">Gérer les articles →</Link>
        </div>
        <div className="admin-table">
          {migratedArticles.slice(0, 5).map((article) => (
            <div className="admin-table-row" key={article.slug}>
              <div><strong>{article.title}</strong><span>{article.category}</span></div>
              <span className="status published">Publié</span>
              <Link href={`/articles/${article.slug}`}>Voir</Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
