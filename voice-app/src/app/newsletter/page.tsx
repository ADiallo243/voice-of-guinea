import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { getPublishedArticles } from "@/lib/content";
import { formatArticleDate } from "@/lib/articles";

export const revalidate = 60;
export const metadata: Metadata = { title: "La newsletter Voice of Guinea", description: "Les faits à retenir, les talents à découvrir et les repères pour comprendre la Guinée. Découvrez un aperçu avant de vous inscrire gratuitement.", alternates: { canonical: "/newsletter" } };

export default async function NewsletterPage() {
  const articles = (await getPublishedArticles()).slice(0, 3);
  return <div className="shell newsletter-page section-space">
    <header className="newsletter-pitch"><span className="section-kicker">La newsletter Voice of Guinea</span><h1>La Guinée mérite votre attention.</h1><p className="lead">Les faits à retenir. Les talents à découvrir. Les repères pour comprendre.</p><p>À chaque édition, une sélection de nos articles et des liens pour aller plus loin. Retrouvez l’essentiel sans parcourir tout le site.</p>
      <NewsletterForm source="newsletter-page" /><p className="newsletter-reassurance">Gratuit · Confirmation par e-mail · Désabonnement en un clic</p><a className="text-link" href="#apercu">Voir un aperçu avant de m’inscrire ↓</a></header>
    <section id="apercu" className="newsletter-preview" aria-labelledby="preview-title"><span className="section-kicker">Avant de vous inscrire</span><h2 id="preview-title">Voici ce que vous pourrez lire.</h2><p>Un aperçu à partir de nos dernières publications. Il illustre la sélection proposée ; ce n’est pas une édition déjà envoyée.</p>
      <ol>{articles.map(article => <li key={article.slug}><time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time><h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3><p>{article.summary}</p><Link className="text-link" href={`/articles/${article.slug}`}>Lire et comprendre →</Link></li>)}</ol>
      {!articles.length && <p>La rédaction prépare ses prochaines publications.</p>}<a className="card-button" href="#contenu-principal">Recevoir l’essentiel ↑</a>
    </section>
  </div>;
}
