import { readingFormats } from "@/lib/reading";
import type { MetadataRoute } from "next";
import { categoryHref } from "@/components/article-card";
import { getPublishedArticles, getPublicCategories } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles();
  const categories = await getPublicCategories();
  const extraCategories = categories
    .filter(
      (c) => !["actualites", "culture", "divertissement"].includes(c.slug),
    )
    .map((c) => ({
      url: `${siteConfig.url}${categoryHref(c.name, c.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  const pages = [
    { path: "", priority: 1, frequency: "daily" as const },
    { path: "/actualites", priority: 0.9, frequency: "daily" as const },
    { path: "/culture", priority: 0.8, frequency: "weekly" as const },
    { path: "/divertissement", priority: 0.8, frequency: "weekly" as const },
    { path: "/a-propos", priority: 0.5, frequency: "monthly" as const },
    {
      path: "/normes-editoriales",
      priority: 0.4,
      frequency: "monthly" as const,
    },
    { path: "/corrections", priority: 0.4, frequency: "monthly" as const },
    { path: "/confidentialite", priority: 0.3, frequency: "yearly" as const },
    { path: "/cookies", priority: 0.3, frequency: "yearly" as const },
    { path: "/accessibilite", priority: 0.3, frequency: "yearly" as const },
    { path: "/mentions-legales", priority: 0.3, frequency: "yearly" as const },
    { path: "/contact", priority: 0.4, frequency: "yearly" as const },
  ];

  return [
    ...pages
      .filter(
        (page) =>
          !["/actualites", "/culture", "/divertissement"].includes(page.path) ||
          categories.some((c) => `/${c.slug}` === page.path),
      )
      .map((page) => ({
        url: `${siteConfig.url}${page.path}`,
        changeFrequency: page.frequency,
        priority: page.priority,
      })),
    {
      url: `${siteConfig.url}/newsletter`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...readingFormats.map((f) => ({
      url: `${siteConfig.url}/rendez-vous/${f.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...extraCategories,
    ...articles.map((article) => ({
      url: `${siteConfig.url}/articles/${article.slug}`,
      lastModified: new Date(
        article.lastEditedAt || article.updatedAt || article.publishedAt,
      ),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: [
        article.image.startsWith("http")
          ? article.image
          : `${siteConfig.url}${article.image}`,
      ],
    })),
  ];
}
