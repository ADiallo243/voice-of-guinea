import { ArticleView } from "@/components/article-view";
import { relatedArticles } from "@/lib/reading";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getArticleRedirect,
  getPublicArticle,
  getPublishedArticles,
} from "@/lib/content";
import { siteConfig } from "@/lib/site";

export async function generateStaticParams() {
  return (await getPublishedArticles()).map((article) => ({
    slug: article.slug,
  }));
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
      modifiedTime:
        article.lastEditedAt || article.updatedAt || article.publishedAt,
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
  if (!article) {
    const destination = await getArticleRedirect(slug);
    if (destination) permanentRedirect(`/articles/${destination}`);
    notFound();
  }
  return (
    <ArticleView
      article={article}
      related={relatedArticles(article, await getPublishedArticles())}
    />
  );
}
