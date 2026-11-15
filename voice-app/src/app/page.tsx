import { ReadingFormats } from "@/components/reading-formats";
import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { getPublishedArticles, getSuggestedArticles } from "@/lib/content";

// Keep the homepage lead synchronized with the latest published article even
// when content is inserted outside the interactive admin publishing action.
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [articles, popular] = await Promise.all([
    getPublishedArticles(),
    getSuggestedArticles(6),
  ]);
  const lead = articles.find((article) => article.featured) || articles[0];
  const latest = articles.filter((article) => article.slug !== lead?.slug);
  const trending = [
    ...popular.filter((article) => article.slug !== lead?.slug),
    ...latest,
  ]
    .filter(
      (article, index, list) =>
        list.findIndex((item) => item.slug === article.slug) === index,
    )
    .slice(0, 4);

  return (
    <>
      <section className="shell hero-section">
        <div className="home-lead">
          {lead ? (
            <>
              <ArticleCard
                article={lead}
                large
                headingLevel={1}
                eyebrow="À la une"
              />
              <aside className="trending">
                <h2>À lire aussi</h2>
                <div>
                  {trending.map((article, index) => (
                    <Link href={`/articles/${article.slug}`} key={article.slug}>
                      <span>0{index + 1}</span>
                      {article.title}
                    </Link>
                  ))}
                </div>
              </aside>
            </>
          ) : (
            <div className="admin-empty">
              <strong>La rédaction prépare ses prochaines publications.</strong>
              <p>Revenez bientôt pour suivre l’actualité de la Guinée.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section-muted">
        <div className="shell">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">À lire maintenant</span>
              <h2>L’essentiel de la Guinée</h2>
            </div>
            <Link href="/actualites" className="text-link">
              Voir toutes les actualités →
            </Link>
          </div>
          <div className="card-grid">
            {latest.slice(0, 3).map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="shell statement" aria-labelledby="mission-title">
        <span>VOICE OF GUINEA</span>
        <blockquote id="mission-title">
          La Guinée en images et en voix.
        </blockquote>
        <p>
          Des faits vérifiés, des histoires humaines et les talents qui font
          avancer le pays.
        </p>
      </section>

      <section className="shell section-space">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Culture vivante</span>
            <h2>Talents & voix</h2>
          </div>
          <Link href="/divertissement" className="text-link">
            Découvrir les talents →
          </Link>
        </div>
        {articles.find((article) => article.category === "Divertissement") && (
          <ArticleCard
            article={articles.find(
              (article) => article.category === "Divertissement",
            )!}
            large
          />
        )}
      </section>

      {articles.some((article) => article.category === "Diaspora") && (
        <section className="shell section-space">
          <div className="section-title-row">
            <h2>Diaspora</h2>
            <Link href="/categories/diaspora" className="text-link">
              Les Guinéens à travers le monde →
            </Link>
          </div>
          <p>
            Vous avez une histoire à partager ? Entrepreneuriat, culture, études
            ou vie associative :{" "}
            <Link href="/contact">racontez-nous votre initiative.</Link>
          </p>
        </section>
      )}

      <ReadingFormats />

      <section className="newsletter-band">
        <div className="shell newsletter-band-inner">
          <div>
            <span className="section-kicker">Newsletter</span>
            <h2>La Guinée mérite votre attention.</h2>
            <p>
              Les faits à retenir, les talents à découvrir et les repères pour
              comprendre.
            </p>
          </div>
          <div>
            <NewsletterForm source="homepage" />
            <p className="newsletter-reassurance">
              Gratuit. Désabonnement en un clic.
            </p>
            <Link href="/newsletter#apercu" className="text-link">
              Voir un aperçu de la newsletter →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
