import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, categoryHref } from "@/components/article-card";
import { ShareButtons } from "@/components/share-buttons";
import { ReadingProgress } from "@/components/reading-progress";
import { SaveArticle } from "@/components/save-article";
import { ArticleView } from "@/components/article-view";
import { formatArticleDate, getReadingTime } from "@/lib/articles";
import { getPublicArticle, getPublishedArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export async function generateStaticParams() {
  return (await getPublishedArticles()).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticle(slug);
  if (!article) return {};

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
    alternates: { canonical: `/articles/${article.slug}` },
    authors: [{ name: article.author }],
    openGraph: {
      type: "article",
      url: `/articles/${article.slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title: article.title,
      description: article.summary,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      section: article.category,
      images: [{ url: article.image, alt: article.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublicArticle(slug);
  if (!article) notFound();
  const related = (await getPublishedArticles())
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .slice(0, 3);
  const articleUrl = `${siteConfig.url}/articles/${article.slug}`;
  const imageUrl = article.image.startsWith("http") ? article.image : `${siteConfig.url}${article.image}`;
  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    headline: article.title,
    description: article.summary,
    image: [imageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    articleSection: article.category,
    inLanguage: "fr",
    author: [{ "@type": "Organization", name: article.author, url: siteConfig.url }],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: siteConfig.publisher,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}${siteConfig.logo}` },
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: article.category, item: `${siteConfig.url}${categoryHref(article.category)}` },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <article className="shell article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ArticleView articleId={article.id} />
      <ReadingProgress />
      <nav className="breadcrumbs" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><span>›</span><Link href={categoryHref(article.category)}>{article.category}</Link>
      </nav>
      <header className="article-header">
        <Link href={categoryHref(article.category)} className="eyebrow">{article.category}</Link>
        <h1>{article.title}</h1>
        <p className="article-deck">{article.summary}</p>
        <div className="article-byline">
          <span>Par {article.author}</span>
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
          {article.updatedAt && <span>Mis à jour le {formatArticleDate(article.updatedAt)}</span>}
          <span>{getReadingTime(article)} min de lecture</span>
        </div>
        <ShareButtons title={article.title} />
        <SaveArticle slug={article.slug} />
      </header>
      <figure className="article-hero">
        <Image src={article.image} alt={article.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 1100px" />
        <figcaption>Photo : {article.imageCredit}</figcaption>
      </figure>
      <div className="article-body">
        {article.correctionNote && (
          <aside className="correction-note">
            <strong>Note de la rédaction</strong>
            <p>{article.correctionNote}</p>
          </aside>
        )}
        {article.blocks.map((block, index) => {
          if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
          if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
          return (
            <figure key={index} className="inline-image">
              <Image src={block.src} alt={block.alt} width={900} height={560} />
              <figcaption>Photo : {block.credit}</figcaption>
            </figure>
          );
        })}
      </div>
      {related.length > 0 && (
        <aside className="related-section" aria-labelledby="related-title">
          <div className="section-title-row">
            <div><span className="section-kicker">À lire aussi</span><h2 id="related-title">Sur le même sujet</h2></div>
          </div>
          <div className="card-grid">
            {related.map((item) => <ArticleCard article={item} key={item.slug} />)}
          </div>
        </aside>
      )}
    </article>
  );
}
