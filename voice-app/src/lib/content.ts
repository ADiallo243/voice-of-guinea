import { createClient } from "@supabase/supabase-js";
import {
  Article,
  Category,
  ContentBlock,
  articles as fallbackArticles,
  getArticle as getFallbackArticle,
} from "./articles";
import { getSupabaseConfig, hasSupabaseConfig } from "./supabase/config";

export type PublicArticle = Article & {
  id?: string;
  updatedAt?: string;
  correctionNote?: string;
  seoTitle?: string;
  seoDescription?: string;
};
export type BreakingHeadline = { text: string; href: string };
type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: ContentBlock[] | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  image_credit: string | null;
  featured: boolean;
  published_at: string;
  updated_at: string;
  correction_note?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  categories: { name: string } | { name: string }[] | null;
};

function publicClient() {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function categoryName(value: string | undefined): Category {
  return value || "Actualités";
}

function mapArticle(row: ArticleRow): PublicArticle {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.excerpt,
    category: categoryName(category?.name),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    correctionNote: row.correction_note || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    author: "Voice of Guinea",
    image: row.hero_image_url || "/brand/logo.svg",
    imageAlt: row.hero_image_alt || row.title,
    imageCredit: row.image_credit || "Voice of Guinea",
    featured: Boolean(row.featured),
    blocks: Array.isArray(row.content) ? row.content : [],
  };
}

export async function getPublishedArticles(): Promise<PublicArticle[]> {
  if (!hasSupabaseConfig()) return fallbackArticles;
  const { data, error } = await publicClient()
    .from("articles")
    .select("id, slug, title, excerpt, content, hero_image_url, hero_image_alt, image_credit, featured, published_at, updated_at, correction_note, seo_title, seo_description, categories(name)")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (error || !data?.length) return fallbackArticles;
  return data.map(mapArticle);
}

export async function getPublicArticle(slug: string): Promise<PublicArticle | undefined> {
  if (!hasSupabaseConfig()) return getFallbackArticle(slug);
  const { data, error } = await publicClient()
    .from("articles")
    .select("id, slug, title, excerpt, content, hero_image_url, hero_image_alt, image_credit, featured, published_at, updated_at, correction_note, seo_title, seo_description, categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) return getFallbackArticle(slug);
  return mapArticle(data);
}

export async function getPublishedByCategory(category: Category) {
  return (await getPublishedArticles()).filter((article) => article.category === category);
}

export async function getBreakingHeadlines(): Promise<BreakingHeadline[]> {
  const fallback = fallbackArticles.slice(0, 4).map((article) => ({
    text: article.title,
    href: `/articles/${article.slug}`,
  }));
  if (!hasSupabaseConfig()) return fallback;
  const now = new Date().toISOString();
  const { data, error } = await publicClient()
    .from("breaking_news")
    .select("headline, external_url, articles(slug)")
    .eq("active", true)
    .lte("starts_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("display_order");
  if (error || !data?.length) return fallback;
  return data.map((item) => {
    const linked = Array.isArray(item.articles) ? item.articles[0] : item.articles;
    return {
      text: item.headline,
      href: item.external_url || `/articles/${linked?.slug}`,
    };
  });
}
