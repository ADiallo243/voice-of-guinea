import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, categoryHref } from "@/components/article-card";
import { getPublicCategories, getPublishedArticles } from "@/lib/content";
export async function CategoryPage({
  category,
  slug,
  intro,
  page = "1",
}: {
  category?: string;
  slug?: string;
  intro?: string;
  page?: string;
}) {
  const categories = await getPublicCategories();
  const selected = categories.find((c) =>
    slug ? c.slug === slug : c.name === category,
  );
  if (!selected) notFound();
  const all = (await getPublishedArticles()).filter((a) =>
    a.categorySlug
      ? a.categorySlug === selected.slug
      : a.category === selected.name,
  );
  const total = Math.max(1, Math.ceil(all.length / 18));
  const current = Math.max(1, Number(page) || 1);
  if (!Number.isInteger(current) || current > total) notFound();
  const articles = all.slice((current - 1) * 18, current * 18);
  const path = categoryHref(selected.name, selected.slug);
  return (
    <div className="shell page-section">
      <header className="page-header">
        <span className="section-kicker">Voice of Guinea</span>
        <h1>{selected.name}</h1>
        <p>
          {selected.description ||
            intro ||
            `Toutes les publications de la rubrique ${selected.name}.`}
        </p>
      </header>
      {articles.length ? (
        <div className="card-grid">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p>
          La rédaction prépare les prochaines publications de cette rubrique.
        </p>
      )}
      {total > 1 && (
        <nav className="pagination" aria-label="Pagination des articles">
          {current > 1 && (
            <Link href={`${path}?page=${current - 1}`}>← Précédente</Link>
          )}
          <span>
            Page {current} sur {total}
          </span>
          {current < total && (
            <Link href={`${path}?page=${current + 1}`}>Suivante →</Link>
          )}
        </nav>
      )}
    </div>
  );
}
