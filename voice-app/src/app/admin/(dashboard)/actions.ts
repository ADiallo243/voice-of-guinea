"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { articles as migratedArticles } from "@/lib/articles";
import { sendSocialPackEmail } from "@/lib/social-pack-email";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { createSupabaseAdminClient, hasSupabaseSecret } from "@/lib/supabase/admin-client";

type Role = "owner" | "editor" | "author";

async function requireNewsroom(roles: Role[] = ["owner", "editor", "author"]) {
  const newsroom = await getNewsroomUser();
  const role = newsroom?.profile?.role as Role | null | undefined;
  if (!newsroom || !newsroom.profile?.active || !role || !roles.includes(role)) redirect("/admin");
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

function imageType(bytes: Uint8Array) {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (isJpeg) return { mime: "image/jpeg", extension: "jpg" };
  if (isPng) return { mime: "image/png", extension: "png" };
  if (isWebp) return { mime: "image/webp", extension: "webp" };
  return null;
}

function externalHttpUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function uploadHeroImage(formData: FormData, userId: string) {
  const file = formData.get("heroImage");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error("L’image dépasse 10 Mo.");

  const newsroom = await requireNewsroom();
  const detectedType = imageType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (!detectedType || (file.type && file.type !== detectedType.mime)) {
    throw new Error("Le fichier doit être une image JPG, PNG ou WebP valide.");
  }
  const extension = detectedType.extension;
  const path = `${userId}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;
  const { error } = await newsroom.supabase.storage
    .from("article-images")
    .upload(path, file, { contentType: detectedType.mime, upsert: false });
  if (error) throw new Error(error.message);

  return newsroom.supabase.storage.from("article-images").getPublicUrl(path).data.publicUrl;
}

export async function saveArticle(formData: FormData) {
  const newsroom = await requireNewsroom();
  const id = text(formData, "id");
  const previous = id
    ? await newsroom.supabase.from("articles").select("status, published_at, editorial_notes, author_id").eq("id", id).maybeSingle()
    : null;
  if (previous?.error) throw new Error(previous.error.message);
  const title = text(formData, "title");
  const excerpt = text(formData, "excerpt");
  const rawContent = text(formData, "content");
  const requestedStatus = text(formData, "status");
  const manager = newsroom.role === "owner" || newsroom.role === "editor";
  const managerStatuses = ["draft", "in_review", "needs_changes", "published", "scheduled", "archived"];
  const status = manager
    ? managerStatuses.includes(requestedStatus) ? requestedStatus : "draft"
    : requestedStatus === "in_review" ? "in_review" : "draft";
  const scheduledFor = text(formData, "scheduledFor");
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
  const publicationDate = text(formData, "publicationDate");
  const publicationDateValue = publicationDate ? new Date(`${publicationDate}T12:00:00Z`) : null;
  const byline = text(formData, "byline");
  const activityDetail = text(formData, "activityDetail");
  if (!title || !excerpt || !rawContent) throw new Error("Titre, résumé et contenu sont obligatoires.");
  if (title.length > 200 || excerpt.length > 500 || rawContent.length > 50_000) {
    throw new Error("Le titre, le résumé ou le contenu dépasse la limite autorisée.");
  }
  if (byline.length > 120) throw new Error("Le nom de l’auteur ne peut pas dépasser 120 caractères.");
  if (activityDetail.length > 280) throw new Error("Le détail de la modification ne peut pas dépasser 280 caractères.");
  if (status === "scheduled" && (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date())) {
    throw new Error("Choisissez une date de programmation valide et future.");
  }
  if (status === "needs_changes" && !text(formData, "editorialNotes")) {
    throw new Error("Expliquez à l’auteur les modifications demandées.");
  }
  if (status === "published" && publicationDate && (!publicationDateValue || Number.isNaN(publicationDateValue.getTime()))) {
    throw new Error("Choisissez une date de publication valide.");
  }
  if (status === "published" && publicationDateValue && publicationDateValue > new Date(Date.now() + 24 * 60 * 60 * 1000)) {
    throw new Error("Pour une publication future, utilisez plutôt la programmation.");
  }

  const uploadedImage = await uploadHeroImage(formData, newsroom.user.id);
  const existingImage = text(formData, "existingImage");
  const publishedAt = status === "published"
    ? publicationDateValue
      ? publicationDateValue.toISOString()
      : previous?.data?.status === "published" && previous.data.published_at
      ? previous.data.published_at
      : new Date().toISOString()
    : null;
  const payload = {
    title,
    slug: text(formData, "slug") || slugify(title),
    byline: byline || null,
    excerpt,
    seo_title: text(formData, "seoTitle") || null,
    seo_description: text(formData, "seoDescription") || null,
    correction_note: text(formData, "correctionNote") || null,
    source_notes: text(formData, "sourceNotes") || null,
    editorial_notes: manager ? text(formData, "editorialNotes") || null : previous?.data?.editorial_notes || null,
    content: contentBlocks(rawContent),
    hero_image_url: uploadedImage || existingImage || null,
    hero_image_alt: text(formData, "imageAlt"),
    image_credit: text(formData, "imageCredit") || null,
    category_id: text(formData, "categoryId") || null,
    author_id: previous?.data?.author_id || newsroom.user.id,
    status,
    featured: manager && formData.get("featured") === "on",
    published_at: publishedAt,
    scheduled_for: status === "scheduled" ? scheduledDate!.toISOString() : null,
    reviewed_at: manager && ["needs_changes", "scheduled", "published"].includes(status) ? new Date().toISOString() : null,
    reviewed_by: manager && ["needs_changes", "scheduled", "published"].includes(status) ? newsroom.user.id : null,
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

  if (payload.featured && status === "published") {
    await newsroom.supabase.from("articles").update({ featured: false }).eq("featured", true);
  }

  const result = id
    ? await newsroom.supabase.from("articles").update(payload).eq("id", id).select("id").single()
    : await newsroom.supabase.from("articles").insert(payload).select("id").single();
  if (result.error) throw new Error(result.error.message);

  // The trigger creates the audit entry. Attach the editor's own explanation to
  // that exact entry without exposing it on the public article.
  if (activityDetail && hasSupabaseSecret()) {
    try {
      const database = createSupabaseAdminClient();
      const { data: activity } = await database
        .from("activity_log")
        .select("id, details")
        .eq("actor_id", newsroom.user.id)
        .eq("entity_type", "articles")
        .eq("entity_id", result.data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activity) {
        const existingDetails = activity.details && typeof activity.details === "object" ? activity.details : {};
        const { error: activityError } = await database
          .from("activity_log")
          .update({ details: { ...existingDetails, note: activityDetail } })
          .eq("id", activity.id);
        if (activityError) console.error("Article saved, but its activity note failed.", activityError);
      }
    } catch (error) {
      console.error("Article saved, but its activity note failed.", error);
    }
  }

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
  redirect(`/admin/articles?saved=${id ? "updated" : "created"}`);
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
  const safeExternalUrl = externalHttpUrl(externalUrl);
  if (!headline || (!articleId && !safeExternalUrl)) {
    throw new Error("Le titre et une destination sont obligatoires.");
  }
  if (externalUrl && !safeExternalUrl) throw new Error("Le lien externe doit commencer par http:// ou https://.");
  const payload = {
    headline,
    article_id: articleId || null,
    external_url: articleId ? null : safeExternalUrl,
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
  // This is an owner-only migration. Use the server-only client so the import is
  // not affected by a browser session or a row-level policy change mid-migration.
  const database = createSupabaseAdminClient();
  const { data: categories, error: categoriesError } = await database.from("categories").select("id, name");
  if (categoriesError) throw new Error(categoriesError.message);
  const categoryIds = new Map((categories ?? []).map((category) => [category.name, category.id]));
  const payload = migratedArticles.map((article) => ({
    title: article.title,
    slug: article.slug,
    byline: article.author || "Voice of Guinea",
    excerpt: article.summary,
    content: article.blocks,
    hero_image_url: article.image,
    hero_image_alt: article.imageAlt,
    image_credit: article.imageCredit,
    category_id: categoryIds.get(article.category) ?? null,
    author_id: newsroom.user.id,
    status: "published",
    featured: false,
    published_at: `${article.publishedAt}T12:00:00Z`,
  }));

  // The database intentionally permits only one featured published article.
  // Clear any old feature first, then restore the designated migrated lead.
  const { error: clearFeatureError } = await database
    .from("articles")
    .update({ featured: false })
    .eq("status", "published")
    .eq("featured", true);
  if (clearFeatureError) throw new Error(clearFeatureError.message);

  const { data: savedArticles, error } = await database
    .from("articles")
    .upsert(payload, { onConflict: "slug" })
    .select("id, slug");
  if (error) throw new Error(error.message);
  if (!savedArticles || savedArticles.length !== payload.length) {
    throw new Error("L’import est incomplet. Aucun message de succès ne sera affiché tant que les cinq articles ne sont pas enregistrés.");
  }

  const featuredArticle = migratedArticles.find((article) => article.featured);
  if (featuredArticle) {
    const { error: setFeatureError } = await database
      .from("articles")
      .update({ featured: true })
      .eq("slug", featuredArticle.slug)
      .eq("status", "published");
    if (setFeatureError) throw new Error(setFeatureError.message);
  }

  const { count: importedCount, error: verificationError } = await database
    .from("articles")
    .select("id", { count: "exact", head: true })
    .in("slug", payload.map((article) => article.slug));
  if (verificationError) throw new Error(verificationError.message);
  if (importedCount !== payload.length) {
    throw new Error("La vérification de l’import a échoué. Réessayez après avoir vérifié la configuration Supabase.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  refreshPublicSite();
  redirect("/admin/articles?import=success");
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
