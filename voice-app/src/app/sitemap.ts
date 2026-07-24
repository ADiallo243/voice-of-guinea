import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.voiceofguinea.com";
  const pages = ["", "/actualites", "/culture", "/divertissement", "/a-propos", "/contact"];

  return [
    ...pages.map((path) => ({ url: `${base}${path}`, lastModified: new Date() })),
    ...articles.map((article) => ({
      url: `${base}/articles/${article.slug}`,
      lastModified: new Date(article.publishedAt),
    })),
  ];
}
