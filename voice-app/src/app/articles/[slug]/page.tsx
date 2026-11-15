import { relatedArticles, readingContent, readingParagraphs } from "@/lib/reading";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, categoryHref } from "@/components/article-card";
import { ShareButtons } from "@/components/share-buttons";
import { ReadingProgress } from "@/components/reading-progress";
import { SaveArticle } from "@/components/save-article";
import { formatArticleDate, getReadingTime, type ContentBlock } from "@/lib/articles";
import { getPublicArticle, getPublishedArticles } from "@/lib/content";
import { serializeJsonLd } from "@/lib/json-ld";
import { siteConfig } from "@/lib/site";

function linkedText(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    if (!/^https?:\/\//.test(part)) return part;
    try {
      const url = new URL(part);
      if (url.protocol !== "http:" && url.protocol !== "https:") return part;
      return <a key={index} href={url.href} target="_blank" rel="noopener noreferrer">{part}</a>;
    } catch {
      return part;
    }
  });
}

type SourceLink = { label: string; url: string };

function sourceLabel(text: string, url: string) {
  const beforeUrl = text.slice(0, text.indexOf(url)).trim();
  return beforeUrl
    .replace(/[\s:;,.\-–—]+$/u, "")
    .split(/\s+[\-–—]\s+|\s*:\s*/u)[0]
    .trim() || new URL(url).hostname.replace(/^www\./, "");
}

function articleSources(blocks: ContentBlock[]): SourceLink[] {
  const sourceHeading = blocks.findIndex((block) => (
    block.type === "heading" && /^sources?$/i.test(block.text.trim())
  ));
  if (sourceHeading < 0) return [];

  const seen = new Set<string>();
  return blocks.slice(sourceHeading + 1).flatMap((block) => {
    if (block.type !== "paragraph" || /^(?:photo|cr[ée]dit|source de l[’']image)\b/i.test(block.text.trim())) return [];
    const url = block.text.match(/https?:\/\/[^\s;]+/u)?.[0]?.replace(/[),.]+$/u, "");
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ label: sourceLabel(block.text, url), url }];
  });
}

function publishedDateTime(date: string) {
  const label = formatArticleDate(date);
  if (!date.includes("T")) return label;
  const hour = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit", minute: "2-digit", timeZone: "Africa/Conakry",
  }).format(new Date(date));
  return `${label} à ${hour} (heure de Conakry)`;
}

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
      modifiedTime: article.lastEditedAt || article.updatedAt || article.publishedAt,
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
  const related = relatedArticles(article, await getPublishedArticles());
  const reading = readingContent(article.blocks);
  const sourceHeading = reading.blocks.findIndex((block) => (
    block.type === "heading" && /^sources?$/i.test(block.text.trim())
  ));
  const bodyBlocks = sourceHeading < 0 ? reading.blocks : reading.blocks.slice(0, sourceHeading);
  const sources = articleSources(article.blocks);
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
    dateModified: article.lastEditedAt || article.updatedAt || article.publishedAt,
    articleSection: article.category,
    inLanguage: "fr",
    author: [{
      "@type": article.author === siteConfig.publisher ? "Organization" : "Person",
      name: article.author,
      ...(article.author === siteConfig.publisher ? { url: siteConfig.url } : {}),
    }],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: siteConfig.publisher,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}${siteConfig.structuredLogo}`, width: 512, height: 512 },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(newsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />
      <ReadingProgress />
      <nav className="breadcrumbs" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><span>›</span><Link href={categoryHref(article.category)}>{article.category}</Link>
      </nav>
      <header className="article-header">
        <Link href={categoryHref(article.category)} className="eyebrow">{article.category}</Link>
        <h1>{article.title}</h1>
        <p className="article-deck">{article.summary}</p>
        <div className="article-byline">
          <div className="byline-person">
            <span className="byline-avatar" aria-hidden="true">{article.author.slice(0, 1).toUpperCase()}</span>
            <div><strong>Par {article.author}</strong><time dateTime={article.publishedAt}>Publié le {publishedDateTime(article.publishedAt)}</time></div>
          </div>
          <div className="article-timestamps">
            {article.lastEditedAt && <time dateTime={article.lastEditedAt}>Mis à jour le {formatArticleDate(article.lastEditedAt)}</time>}
            <span>{getReadingTime(article)} min de lecture</span>
          </div>
        </div>
        <ShareButtons title={article.title} />
        <SaveArticle slug={article.slug} />
      </header>
      <figure className="article-hero">
        <Image src={article.image} alt={article.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 1100px" />
        <figcaption>{article.imageCredit.includes("illustration éditoriale") ? "Image : " : "Photo : "}{article.imageCredit}{article.imageSourceUrl && <> · <a href={article.imageSourceUrl} target="_blank" rel="noopener noreferrer">Source et licence</a></>}</figcaption>
      </figure>
      <div className="article-body">
        {reading.points.length === 3 && <aside className="article-takeaways" aria-labelledby="takeaways-title"><span className="section-kicker">Pour comprendre vite</span><h2 id="takeaways-title">L’essentiel en 3 points</h2><ul>{reading.points.map(point => <li key={point}>{point}</li>)}</ul></aside>}
        {bodyBlocks.filter(b => b.type === "heading").length > 1 && <nav className="article-outline" aria-label="Dans cet article"><strong>Dans cet article</strong>{bodyBlocks.map((b, i) => b.type === "heading" ? <a href={`#section-${i}`} key={i}>{b.text}</a> : null)}</nav>}
        {article.correctionNote && (
          <aside className="correction-note">
            <strong>Note de la rédaction</strong>
            <p>{article.correctionNote}</p>
          </aside>
        )}
        {bodyBlocks.map((block, index) => {
          if (block.type === "heading") return <h2 key={index} id={`section-${index}`}>{block.text}</h2>;
          if (block.type === "paragraph") return <div key={index}>{readingParagraphs(block.text).map((paragraph, i) => <p key={i}>{linkedText(paragraph)}</p>)}{index === 2 && related[0] && <aside className="contextual-reading"><span>Pour aller plus loin</span><Link href={`/articles/${related[0].slug}`}>{related[0].title} →</Link></aside>}</div>;
          return (
            <figure key={index} className="inline-image">
              <Image src={block.src} alt={block.alt} width={900} height={560} />
              <figcaption>Photo : {block.credit}</figcaption>
            </figure>
          );
        })}
        {sources.length > 0 && (
          <aside className="article-sources" aria-label="Sources de l’article">
            <strong>Source{sources.length > 1 ? "s" : ""}</strong>
            <p>
              Cet article a été rédigé à partir des informations publiées par{" "}
              {sources.map((source, index) => (
                <span key={source.url}>
                  {index > 0 && (index === sources.length - 1 ? " et " : ", ")}
                  <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
                </span>
              ))}.
            </p>
          </aside>
        )}
      </div>
      {related.length > 0 && (
        <aside className="related-section" aria-labelledby="related-title">
          <div className="section-title-row">
            <div><span className="section-kicker">À lire aussi</span><h2 id="related-title">Sur le même sujet</h2></div>
          </div>
          <div className="next-reading"><span className="section-kicker">À lire ensuite</span><Link href={`/articles/${related[0].slug}`}><h3>{related[0].title}</h3><p>{related[0].summary}</p><strong>Continuer la lecture →</strong></Link></div>
          {related.length > 1 && <div className="card-grid">{related.slice(1).map(item => <ArticleCard article={item} key={item.slug} />)}</div>}
        </aside>
      )}
    </article>
  );
}
