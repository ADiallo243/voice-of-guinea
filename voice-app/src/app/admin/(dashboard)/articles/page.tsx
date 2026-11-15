import { relationOne, newsroomDate } from "@/lib/newsroom";
import Link from "next/link";
import { getNewsroomUser } from "@/lib/supabase/admin";

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
  searchParams: Promise<{
    q?: string;
    status?: string;
    import?: string;
    saved?: string;
    deleted?: string;
    page?: string;
  }>;
}) {
  const newsroom = await getNewsroomUser();
  const {
    q = "",
    status = "",
    saved,
    deleted,
    page = "1",
  } = await searchParams;
  const currentPage = Math.max(1, Math.floor(Number(page) || 1));
  let query = newsroom!.supabase
    .from("articles")
    .select(
      "id, title, slug, status, featured, created_at, published_at, scheduled_for, categories(name), profiles!articles_author_id_fkey(full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * 40, currentPage * 40 - 1);
  if (q) query = query.ilike("title", `%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: articles, error, count } = await query;

  return (
    <>
      <header className="admin-header">
        <div>
          <span className="admin-kicker">Contenu</span>
          <h1>Articles</h1>
          <p>Créez, modifiez, programmez et organisez vos publications.</p>
        </div>
        <Link href="/admin/articles/new" className="admin-primary">
          + Nouvel article
        </Link>
      </header>
      {saved && (
        <p className="admin-flash success" role="status">
          {saved === "created"
            ? "L’article a été créé avec succès."
            : "Les modifications ont été enregistrées avec succès."}
        </p>
      )}
      {deleted && (
        <p className="admin-flash success" role="status">
          L’article a été archivé.
        </p>
      )}
      {error && (
        <div className="admin-config-warning">
          <strong>Les articles ne peuvent pas être lus pour le moment.</strong>
          <p>{error.message}</p>
        </div>
      )}
      <section className="admin-panel">
        <form className="admin-toolbar">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Rechercher un article…"
          />
          <select
            name="status"
            defaultValue={status}
            aria-label="Filtrer par statut"
          >
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
                  <strong>
                    {article.featured && (
                      <b className="featured-dot">À LA UNE</b>
                    )}
                    {article.title}
                  </strong>
                  <span>
                    {relationOne(article.categories)?.name ?? "Sans catégorie"}{" "}
                    · {relationOne(article.profiles)?.full_name || "Rédaction"}
                  </span>
                </div>
                <span className={`status ${article.status}`}>
                  {statusLabel[article.status] ?? article.status}
                  {article.scheduled_for && (
                    <small> · {newsroomDate(article.scheduled_for)}</small>
                  )}
                </span>
                <Link href={`/admin/articles/${article.id}/edit`}>
                  Modifier
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            <strong>Aucun article ne correspond à ce filtre.</strong>
            <p>Modifiez le filtre ou créez un nouvel article.</p>
          </div>
        )}
      </section>
      <nav className="pagination" aria-label="Pagination des articles">
        {currentPage > 1 && (
          <Link
            href={`?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&page=${currentPage - 1}`}
          >
            Précédente
          </Link>
        )}
        <span>
          Page {currentPage} · {count ?? "—"} résultat(s)
        </span>
        {currentPage * 40 < (count || 0) && (
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
