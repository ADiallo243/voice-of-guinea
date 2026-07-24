import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryHref } from "@/components/article-card";
import { ShareButtons } from "@/components/share-buttons";
import { articles, formatArticleDate, getArticle } from "@/lib/articles";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      publishedTime: article.publishedAt,
      images: [{ url: article.image, alt: article.imageAlt }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <article className="shell article-page">
      <header className="article-header">
        <Link href={categoryHref(article.category)} className="eyebrow">{article.category}</Link>
        <h1>{article.title}</h1>
        <p className="article-deck">{article.summary}</p>
        <div className="article-byline">
          <span>Par {article.author}</span>
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
        </div>
        <ShareButtons title={article.title} />
      </header>
      <figure className="article-hero">
        <Image src={article.image} alt={article.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 1100px" />
        <figcaption>Photo : {article.imageCredit}</figcaption>
      </figure>
      <div className="article-body">
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
    </article>
  );
}
