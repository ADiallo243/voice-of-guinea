import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { articles } from "@/lib/articles";

export default function Home() {
  const [lead, ...latest] = articles;

  return (
    <>
      <section className="shell hero-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Le regard Voice of Guinea</span>
            <h1>L’actualité guinéenne, au plus près de vous.</h1>
          </div>
          <p>Comprendre les événements, découvrir les talents et suivre les histoires qui font avancer la Guinée.</p>
        </div>
        <ArticleCard article={lead} large />
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

      <section className="shell statement">
        <span>NOTRE MISSION</span>
        <blockquote>Raconter la Guinée avec justesse, donner du contexte et faire entendre celles et ceux qui la font vivre.</blockquote>
        <Link href="/a-propos" className="button">Découvrir Voice of Guinea</Link>
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
