import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import { getPublishedArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Rechercher",
  description: "Recherchez les articles publiés par Voice of Guinea.",
  robots: { index: false, follow: true },
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q?.trim() ?? "";
  const needle = normalize(query);
  const articles = query
    ? (await getPublishedArticles()).filter((article) =>
        normalize([
          article.title,
          article.summary,
          article.category,
          ...article.blocks.filter((block) => block.type !== "image").map((block) => block.text),
        ].join(" ")).includes(needle))
    : [];

  return (
    <section className="shell page-section search-page">
      <div className="page-header">
        <span className="section-kicker">Archives</span>
        <h1>Rechercher dans Voice of Guinea</h1>
      </div>
      <form className="public-search" role="search">
        <input name="q" type="search" defaultValue={query} placeholder="Sujet, personnalité, lieu…" autoFocus />
        <button type="submit">Rechercher</button>
      </form>
      {query && (
        <div className="search-results-header">
          <strong>{articles.length} résultat(s)</strong>
          <span>pour « {query} »</span>
        </div>
      )}
      <div className="card-grid search-results">
        {articles.map((article) => <ArticleCard article={article} key={article.slug} />)}
      </div>
      {query && !articles.length && <p className="search-empty">Aucun article ne correspond à cette recherche.</p>}
    </section>
  );
}
