import { cache } from "react";
import { publishedHeadlines, type TickerRow } from "./breaking-headlines";
import { contentHash } from "./naya/core";
import { createClient } from "@supabase/supabase-js";
import {
  Article,
  Category,
  ContentBlock,
  articles as fallbackArticles,
  getArticle as getFallbackArticle,
} from "./articles";
import { getSupabaseConfig, hasSupabaseConfig } from "./supabase/config";
import {
  getLicensedEditorialPhoto,
  restoredOriginalPhotoSlugs,
} from "./editorial-photos";

export type PublicArticle = Article & {
  id?: string;
  nayaHash?: string;
  updatedAt?: string;
  lastEditedAt?: string;
  correctionNote?: string;
  seoTitle?: string;
  seoDescription?: string;
  imageSourceUrl?: string;
  categorySlug?: string;
  categoryActive?: boolean;
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
  image_source_url?: string | null;
  use_cms_image?: boolean;
  categories:
    | { name: string; slug?: string; active?: boolean }
    | { name: string; slug?: string; active?: boolean }[]
    | null;
};

function safeImageUrl(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.startsWith("/images/") || value.startsWith("/brand/")) return value;
  try {
    const imageUrl = new URL(value);
    const supabaseUrl = new URL(getSupabaseConfig().url);
    if (
      imageUrl.protocol === "https:" &&
      imageUrl.origin === supabaseUrl.origin &&
      imageUrl.pathname.startsWith("/storage/v1/object/public/article-images/")
    )
      return imageUrl.toString();
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
      (candidate.type === "heading" || candidate.type === "paragraph") &&
      typeof candidate.text === "string" &&
      candidate.text.trim()
    )
      return [{ type: candidate.type, text: candidate.text.trim() }];
    const src = safeImageUrl(candidate.src);
    if (candidate.type === "image" && src) {
      return [
        {
          type: "image",
          src,
          alt:
            typeof candidate.alt === "string" && candidate.alt.trim()
              ? candidate.alt.trim()
              : "Illustration de l’article",
          credit:
            typeof candidate.credit === "string" && candidate.credit.trim()
              ? candidate.credit.trim()
              : "Voice of Guinea",
        },
      ];
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
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.VOICE_OF_GUINEA_DEMO_CONTENT === "true"
  );
}

function categoryName(value: string | undefined): Category {
  return value || "Actualités";
}

export function mapArticle(row: ArticleRow): PublicArticle {
  const category = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;
  const heroImage = safeImageUrl(row.hero_image_url) || "/brand/logo.svg";
  const seoTitle = row.seo_title?.trim();
  const seoDescription = row.seo_description?.trim();
  // Older generated SEO fields stopped mid-sentence. Prefer the complete
  // headline/deck; search engines decide how much to show in results.
  const completeSeoTitle =
    seoTitle &&
    !(row.title.startsWith(seoTitle) && seoTitle.length < row.title.length)
      ? seoTitle
      : undefined;
  const completeSeoDescription =
    seoDescription &&
    !(
      seoDescription.endsWith("…") &&
      row.excerpt.startsWith(seoDescription.slice(0, -1))
    )
      ? seoDescription
      : undefined;
  const licensedPhoto = row.use_cms_image
    ? undefined
    : getLicensedEditorialPhoto(row.slug);
  // Legacy stock images often depict unrelated countries or events. A story-specific
  // graphic states the actual headline without implying that a photo shows the event.
  const useEditorialGraphic =
    !row.use_cms_image &&
    !licensedPhoto &&
    !restoredOriginalPhotoSlugs.has(row.slug) &&
    (/\/editorial-(?:unique|commons)\//.test(heroImage) ||
      row.slug ===
        "electricite-guinee-financement-additionnel-paaeg-2-27-8-millions" ||
      [
        "/images/news/feguifoot-crise.jpg",
        "/images/news/projet-minier-guinee.jpg",
        "/images/news/guinee-u17-feminine-equipe-niger-2026.jpg",
      ].includes(heroImage));
  return {
    id: row.id,
    nayaHash: contentHash({
      title: row.title,
      summary: row.excerpt,
      blocks: safeContent(row.content),
    }),
    slug: row.slug,
    title: row.title,
    summary: row.excerpt,
    category: categoryName(category?.name),
    categorySlug: category?.slug,
    categoryActive: category?.active ?? true,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    lastEditedAt: row.last_edited_at || undefined,
    correctionNote: row.correction_note || undefined,
    seoTitle: completeSeoTitle,
    seoDescription: completeSeoDescription,
    author: row.byline || "Voice of Guinea",
    image:
      licensedPhoto?.path ||
      (useEditorialGraphic
        ? `/editorial-image/${encodeURIComponent(row.slug)}`
        : heroImage),
    imageAlt:
      licensedPhoto?.alt ||
      (useEditorialGraphic
        ? `Illustration éditoriale : ${row.title}`
        : row.hero_image_alt || row.title),
    imageCredit: licensedPhoto
      ? `${licensedPhoto.alt}. ${licensedPhoto.credit}`
      : useEditorialGraphic
        ? "Voice of Guinea — illustration éditoriale"
        : row.image_credit || "Voice of Guinea",
    imageSourceUrl: licensedPhoto?.source || row.image_source_url || undefined,
    featured: Boolean(row.featured),
    blocks: safeContent(row.content).filter(
      (block) =>
        !(
          ((useEditorialGraphic || licensedPhoto) &&
            block.type === "paragraph" &&
            /^Source de l[’']image\s*:/i.test(block.text)) ||
          (row.slug === "guinee-u17-victoire-niger" && block.type === "image")
        ),
    ),
  };
}

export const getPublishedArticles = cache(
  async (): Promise<PublicArticle[]> => {
    if (!hasSupabaseConfig())
      return canUseDemoContent() ? fallbackArticles : [];
    const { data, error } = await publicClient()
      .from("articles")
      .select(
        "id, slug, title, excerpt, content, hero_image_url, hero_image_alt, image_credit, featured, published_at, updated_at, byline, last_edited_at, correction_note, seo_title, seo_description, image_source_url, use_cms_image, categories(name,slug,active)",
      )
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });
    if (error || !data?.length)
      return canUseDemoContent() ? fallbackArticles : [];
    return data
      .map(mapArticle)
      .filter((article) => article.categoryActive !== false);
  },
);

export const getPublicArticle = cache(
  async (slug: string): Promise<PublicArticle | undefined> => {
    if (!hasSupabaseConfig())
      return canUseDemoContent() ? getFallbackArticle(slug) : undefined;
    const { data, error } = await publicClient()
      .from("articles")
      .select(
        "id, slug, title, excerpt, content, hero_image_url, hero_image_alt, image_credit, featured, published_at, updated_at, byline, last_edited_at, correction_note, seo_title, seo_description, image_source_url, use_cms_image, categories(name,slug,active)",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error || !data)
      return canUseDemoContent() ? getFallbackArticle(slug) : undefined;
    return mapArticle(data);
  },
);

export async function getPublishedByCategory(category: Category) {
  return (await getPublishedArticles()).filter(
    (article) => article.category === category,
  );
}

// A chronological reading suggestion, not an audience ranking.
export async function getSuggestedArticles(
  limit = 4,
): Promise<PublicArticle[]> {
  return (await getPublishedArticles()).slice(0, limit);
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
    .select("headline, external_url, articles(slug,status,published_at)")
    .eq("active", true)
    .lte("starts_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("display_order");
  if (error || !data?.length) return canUseDemoContent() ? fallback : [];
  const headlines = publishedHeadlines(data as TickerRow[]);
  if (headlines.length) return headlines;
  // If every curated item targets unpublished content, keep the ticker useful
  // with real published headlines, without exposing the withdrawn stories.
  return (await getPublishedArticles()).slice(0, 4).map((article) => ({
    text: article.title,
    href: `/articles/${article.slug}`,
  }));
}

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  active: boolean;
};
export const getPublicCategories = cache(
  async (): Promise<PublicCategory[]> => {
    if (!hasSupabaseConfig())
      return [
        {
          id: "demo-news",
          name: "Actualités",
          slug: "actualites",
          description: null,
          display_order: 1,
          active: true,
        },
        {
          id: "demo-culture",
          name: "Culture",
          slug: "culture",
          description: null,
          display_order: 2,
          active: true,
        },
        {
          id: "demo-talents",
          name: "Divertissement",
          slug: "divertissement",
          description: null,
          display_order: 3,
          active: true,
        },
      ];
    const { data, error } = await publicClient()
      .from("categories")
      .select("id,name,slug,description,display_order,active")
      .eq("active", true)
      .order("display_order");
    if (error) {
      console.error("Public category read failed", error.code);
      return [];
    }
    return data ?? [];
  },
);

export async function getArticleRedirect(slug: string) {
  if (!hasSupabaseConfig()) return undefined;
  const { data } = await publicClient()
    .from("article_redirects")
    .select("articles(slug,status,published_at)")
    .eq("old_slug", slug)
    .maybeSingle();
  const target = Array.isArray(data?.articles)
    ? data.articles[0]
    : data?.articles;
  return target?.status === "published" &&
    target.published_at &&
    Date.parse(target.published_at) <= Date.now()
    ? target.slug
    : undefined;
}
