import { ArticleCard } from "@/components/article-card";
import { Category } from "@/lib/articles";
import { getPublishedByCategory } from "@/lib/content";

export async function CategoryPage({
  category,
  intro,
}: {
  category: Category;
  intro: string;
}) {
  const categoryArticles = await getPublishedByCategory(category);

  return (
    <div className="shell page-section">
      <header className="page-header">
        <span className="section-kicker">Voice of Guinea</span>
        <h1>{category}</h1>
        <p>{intro}</p>
      </header>
      {categoryArticles.length ? (
        <div className="card-grid">
          {categoryArticles.map((article) => <ArticleCard key={article.slug} article={article} />)}
        </div>
      ) : (
        <div className="empty-state">
          <span>Bientôt</span>
          <h2>De nouvelles histoires arrivent.</h2>
          <p>Cette rubrique se prépare. Revenez bientôt pour découvrir nos prochains sujets.</p>
        </div>
      )}
    </div>
  );
}
