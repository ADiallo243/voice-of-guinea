import type { MetadataRoute } from "next";
import { categoryHref } from "@/components/article-card";
import { getPublishedArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles();
  const extraCategories = [...new Set(articles.map((article) => article.category))]
    .filter((category) => !["Actualités", "Culture", "Divertissement"].includes(category))
    .map((category) => ({
      url: `${siteConfig.url}${categoryHref(category)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  const pages = [
    { path: "", priority: 1, frequency: "daily" as const },
    { path: "/actualites", priority: 0.9, frequency: "daily" as const },
    { path: "/culture", priority: 0.8, frequency: "weekly" as const },
    { path: "/divertissement", priority: 0.8, frequency: "weekly" as const },
    { path: "/a-propos", priority: 0.5, frequency: "monthly" as const },
    { path: "/normes-editoriales", priority: 0.4, frequency: "monthly" as const },
    { path: "/corrections", priority: 0.4, frequency: "monthly" as const },
    { path: "/confidentialite", priority: 0.3, frequency: "yearly" as const },
    { path: "/cookies", priority: 0.3, frequency: "yearly" as const },
    { path: "/accessibilite", priority: 0.3, frequency: "yearly" as const },
    { path: "/mentions-legales", priority: 0.3, frequency: "yearly" as const },
    { path: "/contact", priority: 0.4, frequency: "yearly" as const },
  ];

  return [
    ...pages.map((page) => ({
      url: `${siteConfig.url}${page.path}`,
      changeFrequency: page.frequency,
      priority: page.priority,
    })),
    ...extraCategories,
    ...articles.map((article) => ({
      url: `${siteConfig.url}/articles/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: [article.image.startsWith("http") ? article.image : `${siteConfig.url}${article.image}`],
    })),
  ];
}
