import Image from "next/image";
import Link from "next/link";
import { Article, formatArticleDate, getReadingTime } from "@/lib/articles";

export function ArticleCard({
  article,
  large = false,
  headingLevel = 2,
}: {
  article: Article;
  large?: boolean;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <article className={large ? "article-card article-card-large" : "article-card"}>
      <Link href={`/articles/${article.slug}`} className="card-image">
        <Image src={article.image} alt={article.imageAlt} fill sizes={large ? "(max-width: 800px) 100vw, 65vw" : "(max-width: 800px) 100vw, 33vw"} />
      </Link>
      <div className="card-content">
        <Link href={categoryHref(article.category)} className="eyebrow">
          {article.category}
        </Link>
        <Heading>
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </Heading>
        <p>{article.summary}</p>
        {large && <Link href={`/articles/${article.slug}`} className="card-button">Lire l’article</Link>}
        <div className="card-meta">
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
          <span>{getReadingTime(article)} min de lecture</span>
        </div>
      </div>
    </article>
  );
}

export function categoryHref(category: Article["category"]) {
  if (category === "Actualités") return "/actualites";
  if (category === "Divertissement") return "/divertissement";
  if (category === "Culture") return "/culture";
  const slug = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `/categories/${slug}`;
}
