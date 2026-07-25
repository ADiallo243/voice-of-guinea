"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { articles as migratedArticles } from "@/lib/articles";
import { getNewsroomUser } from "@/lib/supabase/admin";

type Role = "owner" | "editor" | "author";

async function requireNewsroom(roles: Role[] = ["owner", "editor", "author"]) {
  const newsroom = await getNewsroomUser();
  const role = newsroom?.profile?.role as Role | null | undefined;
  if (!newsroom || !role || !roles.includes(role)) redirect("/admin");
  return { ...newsroom, role };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function contentBlocks(content: string) {
  return content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part.startsWith("## ")
        ? { type: "heading", text: part.slice(3) }
        : { type: "paragraph", text: part },
    );
}

async function uploadHeroImage(formData: FormData, userId: string) {
  const file = formData.get("heroImage");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Format d’image non autorisé.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("L’image dépasse 10 Mo.");

  const newsroom = await requireNewsroom();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;
  const { error } = await newsroom.supabase.storage
    .from("article-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  return newsroom.supabase.storage.from("article-images").getPublicUrl(path).data.publicUrl;
}

export async function saveArticle(formData: FormData) {
  const newsroom = await requireNewsroom();
  const id = text(formData, "id");
  const title = text(formData, "title");
  const excerpt = text(formData, "excerpt");
  const rawContent = text(formData, "content");
  const requestedStatus = text(formData, "status");
  const manager = newsroom.role === "owner" || newsroom.role === "editor";
  const status = manager && ["published", "scheduled", "archived"].includes(requestedStatus)
    ? requestedStatus
    : "draft";
  if (!title || !excerpt || !rawContent) throw new Error("Titre, résumé et contenu sont obligatoires.");

  const uploadedImage = await uploadHeroImage(formData, newsroom.user.id);
  const existingImage = text(formData, "existingImage");
  const payload = {
    title,
    slug: text(formData, "slug") || slugify(title),
    excerpt,
    content: contentBlocks(rawContent),
    hero_image_url: uploadedImage || existingImage || null,
    hero_image_alt: text(formData, "imageAlt"),
    image_credit: text(formData, "imageCredit") || null,
    category_id: text(formData, "categoryId") || null,
    author_id: newsroom.user.id,
    status,
    featured: manager && formData.get("featured") === "on",
    published_at: status === "published" ? new Date().toISOString() : null,
    scheduled_for: status === "scheduled" ? text(formData, "scheduledFor") || null : null,
  };

  if (payload.featured) {
    await newsroom.supabase.from("articles").update({ featured: false }).eq("featured", true);
  }

  const result = id
    ? await newsroom.supabase.from("articles").update(payload).eq("id", id).select("id").single()
    : await newsroom.supabase.from("articles").insert(payload).select("id").single();
  if (result.error) throw new Error(result.error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${result.data.id}/edit?saved=1`);
}

export async function deleteArticle(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const id = text(formData, "id");
  const { error } = await newsroom.supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  redirect("/admin/articles?deleted=1");
}

export async function saveCategory(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) throw new Error("Le nom de la catégorie est obligatoire.");
  const payload = {
    name,
    slug: text(formData, "slug") || slugify(name),
    description: text(formData, "description") || null,
    display_order: Number(text(formData, "displayOrder") || 0),
    active: formData.get("active") === "on",
  };
  const result = id
    ? await newsroom.supabase.from("categories").update(payload).eq("id", id)
    : await newsroom.supabase.from("categories").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const newsroom = await requireNewsroom(["owner"]);
  const { error } = await newsroom.supabase.from("categories").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
}

export async function saveBreakingNews(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const id = text(formData, "id");
  const headline = text(formData, "headline");
  const articleId = text(formData, "articleId");
  const externalUrl = text(formData, "externalUrl");
  if (!headline || (!articleId && !externalUrl)) {
    throw new Error("Le titre et une destination sont obligatoires.");
  }
  const payload = {
    headline,
    article_id: articleId || null,
    external_url: externalUrl || null,
    display_order: Number(text(formData, "displayOrder") || 0),
    active: formData.get("active") === "on",
    expires_at: text(formData, "expiresAt") || null,
    created_by: newsroom.user.id,
  };
  const result = id
    ? await newsroom.supabase.from("breaking_news").update(payload).eq("id", id)
    : await newsroom.supabase.from("breaking_news").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/breaking-news");
}

export async function deleteBreakingNews(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const { error } = await newsroom.supabase.from("breaking_news").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/breaking-news");
}

export async function importMigratedArticles() {
  const newsroom = await requireNewsroom(["owner"]);
  const { data: categories } = await newsroom.supabase.from("categories").select("id, name");
  const categoryIds = new Map((categories ?? []).map((category) => [category.name, category.id]));
  const payload = migratedArticles.map((article) => ({
    title: article.title,
    slug: article.slug,
    excerpt: article.summary,
    content: article.blocks,
    hero_image_url: article.image,
    hero_image_alt: article.imageAlt,
    image_credit: article.imageCredit,
    category_id: categoryIds.get(article.category) ?? null,
    author_id: newsroom.user.id,
    status: "published",
    featured: Boolean(article.featured),
    published_at: `${article.publishedAt}T12:00:00Z`,
  }));
  const { error } = await newsroom.supabase.from("articles").upsert(payload, { onConflict: "slug" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
}
