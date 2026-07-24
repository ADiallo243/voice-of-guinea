import Image from "next/image";
import Link from "next/link";
import { Article, formatArticleDate, getReadingTime } from "@/lib/articles";

export function ArticleCard({
  article,
  large = false,
}: {
  article: Article;
  large?: boolean;
}) {
  return (
    <article className={large ? "article-card article-card-large" : "article-card"}>
      <Link href={`/articles/${article.slug}`} className="card-image">
        <Image src={article.image} alt={article.imageAlt} fill sizes={large ? "(max-width: 800px) 100vw, 65vw" : "(max-width: 800px) 100vw, 33vw"} />
      </Link>
      <div className="card-content">
        <Link href={categoryHref(article.category)} className="eyebrow">
          {article.category}
        </Link>
        <h2>
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h2>
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
  return "/culture";
}
