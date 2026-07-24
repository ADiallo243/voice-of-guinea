import Link from "next/link";
import { articles } from "@/lib/articles";

export default function AdminArticlesPage() {
  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Contenu</span><h1>Articles</h1><p>Créez, programmez et organisez vos publications.</p></div>
        <Link href="/admin/articles/new" className="admin-primary">+ Nouvel article</Link>
      </header>
      <section className="admin-panel">
        <div className="admin-toolbar">
          <input type="search" placeholder="Rechercher un article…" />
          <select aria-label="Filtrer par statut"><option>Tous les statuts</option><option>Publié</option><option>Brouillon</option></select>
        </div>
        <div className="admin-table">
          {articles.map((article) => (
            <div className="admin-table-row" key={article.slug}>
              <div><strong>{article.title}</strong><span>{article.category} · {article.author}</span></div>
              <span className="status published">Publié</span>
              <Link href={`/articles/${article.slug}`}>Ouvrir</Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
