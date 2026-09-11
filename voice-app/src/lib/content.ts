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
  lastEditedAt?: string;
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
  content: unknown;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  image_credit: string | null;
  featured: boolean;
  published_at: string;
  updated_at: string;
  byline?: string | null;
  last_edited_at?: string | null;
  correction_note?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  categories: { name: string } | { name: string }[] | null;
};

function safeImageUrl(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.startsWith("/images/") || value.startsWith("/brand/")) return value;
  try {
    const imageUrl = new URL(value);
    const supabaseUrl = new URL(getSupabaseConfig().url);
    if (
      imageUrl.protocol === "https:"
      && imageUrl.origin === supabaseUrl.origin
      && imageUrl.pathname.startsWith("/storage/v1/object/public/article-images/")
    ) return imageUrl.toString();
  } catch {
    return null;
  }
  return null;
}

function safeContent(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((block): ContentBlock[] => {
    if (!block || typeof block !== "object") return [];
    const candidate = block as Record<string, unknown>;
    if (
      (candidate.type === "heading" || candidate.type === "paragraph")
      && typeof candidate.text === "string"
      && candidate.text.trim()
    ) return [{ type: candidate.type, text: candidate.text.trim() }];
    const src = safeImageUrl(candidate.src);
    if (candidate.type === "image" && src) {
      return [{
        type: "image",
        src,
        alt: typeof candidate.alt === "string" && candidate.alt.trim() ? candidate.alt.trim() : "Illustration de l’article",
        credit: typeof candidate.credit === "string" && candidate.credit.trim() ? candidate.credit.trim() : "Voice of Guinea",
      }];
    }
    return [];
  });
}

function publicClient() {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function canUseDemoContent() {
  return process.env.NODE_ENV !== "production" || process.env.VOICE_OF_GUINEA_DEMO_CONTENT === "true";
}

function categoryName(value: string | undefined): Category {
  return value || "Actualités";
}

function mapArticle(row: ArticleRow): PublicArticle {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const heroImage = safeImageUrl(row.hero_image_url) || "/brand/logo.svg";
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.excerpt,
    category: categoryName(category?.name),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    lastEditedAt: row.last_edited_at || undefined,
    correctionNote: row.correction_note || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    author: row.byline || "Voice of Guinea",
    image: heroImage,
    imageAlt: row.hero_image_alt || row.title,
    imageCredit: row.image_credit || "Voice of Guinea",
    featured: Boolean(row.featured),
    blocks: safeContent(row.content),
  };
}

export async function getPublishedArticles(): Promise<PublicArticle[]> {
  if (!hasSupabaseConfig()) return canUseDemoContent() ? fallbackArticles : [];
  const { data, error } = await publicClient()
    .from("articles")
    .select("id, slug, title, excerpt, content, hero_image_url, hero_image_alt, image_credit, featured, published_at, updated_at, byline, last_edited_at, correction_note, seo_title, seo_description, categories(name)")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (error || !data?.length) return canUseDemoContent() ? fallbackArticles : [];
  return data.map(mapArticle);
}

export async function getPublicArticle(slug: string): Promise<PublicArticle | undefined> {
  if (!hasSupabaseConfig()) return canUseDemoContent() ? getFallbackArticle(slug) : undefined;
  const { data, error } = await publicClient()
    .from("articles")
    .select("id, slug, title, excerpt, content, hero_image_url, hero_image_alt, image_credit, featured, published_at, updated_at, byline, last_edited_at, correction_note, seo_title, seo_description, categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) return canUseDemoContent() ? getFallbackArticle(slug) : undefined;
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
  if (!hasSupabaseConfig()) return canUseDemoContent() ? fallback : [];
  const now = new Date().toISOString();
  const { data, error } = await publicClient()
    .from("breaking_news")
    .select("headline, external_url, articles(slug)")
    .eq("active", true)
    .lte("starts_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("display_order");
  if (error || !data?.length) return canUseDemoContent() ? fallback : [];
  return data.map((item) => {
    const linked = Array.isArray(item.articles) ? item.articles[0] : item.articles;
    return {
      text: item.headline,
      href: item.external_url || `/articles/${linked?.slug}`,
    };
  });
}
