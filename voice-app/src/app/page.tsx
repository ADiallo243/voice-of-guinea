import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { getPublishedArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const articles = await getPublishedArticles();
  const lead = articles.find((article) => article.featured) ?? articles[0];
  const latest = articles.filter((article) => article.slug !== lead?.slug);
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.logo}`,
    email: siteConfig.email,
    address: { "@type": "PostalAddress", addressLocality: "Conakry", addressCountry: "GN" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <section className="shell hero-section">
        <div className="home-lead">
          {lead ? (
            <>
              <ArticleCard article={lead} large headingLevel={1} />
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
            </>
          ) : (
            <div className="admin-empty"><strong>La rédaction prépare ses prochaines publications.</strong><p>Revenez bientôt pour suivre l’actualité de la Guinée.</p></div>
          )}
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
        {articles.find((article) => article.category === "Divertissement") && (
          <ArticleCard article={articles.find((article) => article.category === "Divertissement")!} large />
        )}
      </section>

      <section className="newsletter-band">
        <div className="shell newsletter-band-inner">
          <div>
            <span className="section-kicker">Newsletter</span>
            <h2>L’essentiel de la Guinée, directement dans votre boîte mail.</h2>
            <p>Une sélection éditoriale claire, sans bruit inutile.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
import type { Metadata } from "next";
