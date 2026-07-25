"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { articles as migratedArticles } from "@/lib/articles";
import { sendSocialPackEmail } from "@/lib/social-pack-email";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

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

function refreshPublicSite() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/news-sitemap.xml");
  revalidatePath("/rss.xml");
}

function contentBlocks(content: string) {
  return content
    .split(/\r?\n\s*\r?\n/)
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
  const previous = id
    ? await newsroom.supabase.from("articles").select("status").eq("id", id).maybeSingle()
    : null;
  if (previous?.error) throw new Error(previous.error.message);
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
    seo_title: text(formData, "seoTitle") || null,
    seo_description: text(formData, "seoDescription") || null,
    correction_note: text(formData, "correctionNote") || null,
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
  if (
    status === "published"
    && (!payload.category_id
      || !payload.hero_image_url
      || !payload.hero_image_alt
      || !payload.image_credit
      || payload.content.length < 3)
  ) {
    throw new Error(
      "Avant publication, ajoutez une catégorie, au moins trois blocs de contenu, une image, son texte alternatif et son crédit.",
    );
  }

  if (payload.featured) {
    await newsroom.supabase.from("articles").update({ featured: false }).eq("featured", true);
  }

  const result = id
    ? await newsroom.supabase.from("articles").update(payload).eq("id", id).select("id").single()
    : await newsroom.supabase.from("articles").insert(payload).select("id").single();
  if (result.error) throw new Error(result.error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  refreshPublicSite();
  if (status === "published" && previous?.data?.status !== "published") {
    try {
      await sendSocialPackEmail({
        id: result.data.id,
        title: payload.title,
        excerpt: payload.excerpt,
        slug: payload.slug,
        imageUrl: payload.hero_image_url,
        imageAlt: payload.hero_image_alt,
        imageCredit: payload.image_credit,
      });
    } catch (error) {
      console.error("The article was published, but its social pack email failed.", error);
    }
  }
  redirect(`/admin/articles/${result.data.id}/edit?saved=1`);
}

export async function deleteArticle(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const id = text(formData, "id");
  const { error } = await newsroom.supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  refreshPublicSite();
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
  refreshPublicSite();
}

export async function deleteCategory(formData: FormData) {
  const newsroom = await requireNewsroom(["owner"]);
  const { error } = await newsroom.supabase.from("categories").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  refreshPublicSite();
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
  refreshPublicSite();
}

export async function deleteBreakingNews(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const { error } = await newsroom.supabase.from("breaking_news").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/breaking-news");
  refreshPublicSite();
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
  refreshPublicSite();
}

export async function inviteTeamMember(formData: FormData) {
  await requireNewsroom(["owner"]);
  const email = text(formData, "email").toLowerCase();
  const fullName = text(formData, "fullName");
  const role = text(formData, "role") as Role;
  if (!email || !["editor", "author"].includes(role)) {
    throw new Error("Une adresse e-mail et un rôle valide sont obligatoires.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"}/admin/login`,
  });
  if (error) throw new Error(error.message);
  if (data.user) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: fullName, role, active: true })
      .eq("id", data.user.id);
    if (profileError) throw new Error(profileError.message);
  }
  revalidatePath("/admin/equipe");
}

export async function updateTeamMember(formData: FormData) {
  const newsroom = await requireNewsroom(["owner"]);
  const id = text(formData, "id");
  const role = text(formData, "role") as Role;
  const active = formData.get("active") === "on";
  if (id === newsroom.user.id && (!active || role !== "owner")) {
    throw new Error("Vous ne pouvez pas désactiver ou rétrograder votre propre compte propriétaire.");
  }
  if (!["owner", "editor", "author"].includes(role)) throw new Error("Rôle invalide.");

  const { error } = await newsroom.supabase.from("profiles").update({ role, active }).eq("id", id);
  if (error) throw new Error(error.message);

  const admin = createSupabaseAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: active ? "none" : "876000h",
  });
  if (authError) throw new Error(authError.message);
  revalidatePath("/admin/equipe");
}

export async function updateNewsletterSubscriber(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!["pending", "active", "unsubscribed"].includes(status)) {
    throw new Error("Statut d’abonnement invalide.");
  }
  const { error } = await newsroom.supabase
    .from("newsletter_subscribers")
    .update({
      status,
      confirmed_at: status === "active" ? new Date().toISOString() : null,
      unsubscribed_at: status === "unsubscribed" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/newsletter");
}

export async function deleteNewsletterSubscriber(formData: FormData) {
  const newsroom = await requireNewsroom(["owner"]);
  const { error } = await newsroom.supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/newsletter");
}
