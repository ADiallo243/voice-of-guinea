import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { articles } from "@/lib/articles";

export default function Home() {
  const [lead, ...latest] = articles;

  return (
    <>
      <section className="shell hero-section">
        <div className="home-lead">
          <ArticleCard article={lead} large />
          <aside className="trending">
            <h2>Tendance</h2>
            <div>
              {articles.slice(0, 4).map((article, index) => (
                <Link href={`/articles/${article.slug}`} key={article.slug}>
                  <span>0{index + 1}</span>
                  {article.title}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section-muted">
        <div className="shell">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">À lire maintenant</span>
              <h2>Les dernières nouvelles</h2>
            </div>
            <Link href="/actualites" className="text-link">Voir toutes les actualités →</Link>
          </div>
          <div className="card-grid">
            {latest.slice(0, 3).map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>

      <section className="shell section-space">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Culture & scène</span>
            <h2>Talents guinéens</h2>
          </div>
          <Link href="/divertissement" className="text-link">Explorer →</Link>
        </div>
        <ArticleCard article={articles[4]} large />
      </section>
    </>
  );
}
