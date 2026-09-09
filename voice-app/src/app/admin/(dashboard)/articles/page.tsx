import Link from "next/link";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { importMigratedArticles } from "../actions";

const statusLabel: Record<string, string> = {
  published: "Publié",
  draft: "Brouillon",
  in_review: "À relire",
  needs_changes: "À corriger",
  scheduled: "Programmé",
  archived: "Archivé",
};

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; import?: string }>;
}) {
  const newsroom = await getNewsroomUser();
  const { q = "", status = "", import: importState } = await searchParams;
  let query = newsroom!.supabase
    .from("articles")
    .select("id, title, slug, status, featured, created_at, published_at, categories(name), profiles(full_name)")
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("title", `%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: articles, error } = await query;
  const isOwner = newsroom?.profile?.role === "owner";

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Contenu</span><h1>Articles</h1><p>Créez, modifiez, programmez et organisez vos publications.</p></div>
        <Link href="/admin/articles/new" className="admin-primary">+ Nouvel article</Link>
      </header>
      {importState === "success" && <p className="admin-flash success" role="status">Les cinq articles existants ont été importés. Vous pouvez maintenant les revoir et les publier.</p>}
      {error && <div className="admin-config-warning"><strong>Les articles ne peuvent pas être lus pour le moment.</strong><p>{error.message}</p></div>}
      <section className="admin-panel">
        <form className="admin-toolbar">
          <input name="q" type="search" defaultValue={q} placeholder="Rechercher un article…" />
          <select name="status" defaultValue={status} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
            <option value="in_review">À relire</option>
            <option value="needs_changes">À corriger</option>
            <option value="scheduled">Programmé</option>
            <option value="archived">Archivé</option>
          </select>
          <button type="submit">Filtrer</button>
        </form>
        {articles?.length ? (
          <div className="admin-table">
            {articles.map((article) => (
              <div className="admin-table-row" key={article.id}>
                <div>
                  <strong>{article.featured && <b className="featured-dot">À LA UNE</b>}{article.title}</strong>
                  <span>{article.categories?.[0]?.name ?? "Sans catégorie"} · {article.profiles?.[0]?.full_name || "Rédaction"}</span>
                </div>
                <span className={`status ${article.status}`}>{statusLabel[article.status] ?? article.status}</span>
                <Link href={`/admin/articles/${article.id}/edit`}>Modifier</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            <strong>Aucun article dans Supabase.</strong>
            <p>Créez votre premier article ou importez les cinq articles du site actuel.</p>
            {isOwner && <form action={importMigratedArticles}><button className="admin-secondary" type="submit">Importer les 5 articles existants</button></form>}
          </div>
        )}
      </section>
    </>
  );
}
