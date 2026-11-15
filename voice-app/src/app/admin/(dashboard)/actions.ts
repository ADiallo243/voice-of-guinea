"use server";

import type { ContentBlock } from "@/lib/articles";
import {
  parseSchedule,
  publicationTime,
  parseEditorText,
  approvedSourceUrls,
} from "@/lib/newsroom";
import { editorialPoints, readingContent } from "@/lib/reading";
import { after } from "next/server";
import { generateSummary } from "@/lib/naya/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendSocialPackEmail } from "@/lib/social-pack-email";
import { getNewsroomUser } from "@/lib/supabase/admin";
import {
  createSupabaseAdminClient,
  hasSupabaseSecret,
} from "@/lib/supabase/admin-client";
import { getSupabaseConfig } from "@/lib/supabase/config";

type Role = "owner" | "editor" | "author";

async function requireNewsroom(roles: Role[] = ["owner", "editor", "author"]) {
  const newsroom = await getNewsroomUser();
  const role = newsroom?.profile?.role as Role | null | undefined;
  if (!newsroom || !newsroom.profile?.active || !role || !roles.includes(role))
    redirect("/admin");
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

function imageType(bytes: Uint8Array) {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (isJpeg) return { mime: "image/jpeg", extension: "jpg" };
  if (isPng) return { mime: "image/png", extension: "png" };
  if (isWebp) return { mime: "image/webp", extension: "webp" };
  return null;
}

function externalHttpUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function isAllowedArticleImageUrl(value: string) {
  if (!value) return true;
  if (
    value === "/brand/logo.svg" ||
    (value.startsWith("/images/") && !value.includes(".."))
  )
    return true;
  try {
    const imageUrl = new URL(value);
    const supabaseUrl = new URL(getSupabaseConfig().url);
    return (
      imageUrl.origin === supabaseUrl.origin &&
      imageUrl.pathname.startsWith("/storage/v1/object/public/article-images/")
    );
  } catch {
    return false;
  }
}

async function uploadHeroImage(formData: FormData, userId: string) {
  const file = formData.get("heroImage");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error("L’image dépasse 10 Mo.");

  const newsroom = await requireNewsroom();
  const detectedType = imageType(
    new Uint8Array(await file.slice(0, 12).arrayBuffer()),
  );
  if (!detectedType || (file.type && file.type !== detectedType.mime)) {
    throw new Error("Le fichier doit être une image JPG, PNG ou WebP valide.");
  }
  const extension = detectedType.extension;
  const path = `${userId}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;
  const { error } = await newsroom.supabase.storage
    .from("article-images")
    .upload(path, file, { contentType: detectedType.mime, upsert: false });
  if (error) throw new Error(error.message);

  return newsroom.supabase.storage.from("article-images").getPublicUrl(path)
    .data.publicUrl;
}

export async function saveArticle(formData: FormData) {
  const newsroom = await requireNewsroom();
  const id = text(formData, "id");
  const previous = id
    ? await newsroom.supabase.rpc("get_newsroom_article", { article_id: id })
    : null;
  if (previous?.error) throw new Error(previous.error.message);
  if (id && !previous?.data) throw new Error("Article introuvable.");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");
  if (
    id &&
    (!expectedUpdatedAt || expectedUpdatedAt !== previous?.data?.updated_at)
  )
    throw new Error(
      "Cet article a changé. Rechargez la page avant de réessayer.",
    );
  const title = text(formData, "title");
  const excerpt = text(formData, "excerpt");
  const rawContent = text(formData, "content");
  const requestedStatus = text(formData, "status");
  const manager = newsroom.role === "owner" || newsroom.role === "editor";
  const managerStatuses = [
    "draft",
    "in_review",
    "needs_changes",
    "published",
    "scheduled",
    "archived",
  ];
  const status = manager
    ? managerStatuses.includes(requestedStatus)
      ? requestedStatus
      : "draft"
    : requestedStatus === "in_review"
      ? "in_review"
      : "draft";
  const scheduledFor = text(formData, "scheduledFor");
  const scheduledDate = scheduledFor ? parseSchedule(scheduledFor) : null;
  const changePublicationDate = formData.get("changePublicationDate") === "on";
  if (changePublicationDate && !text(formData, "correctionNote"))
    throw new Error(
      "Justifiez la correction de date dans la note de mise à jour.",
    );
  const byline = text(formData, "byline");
  const activityDetail = text(formData, "activityDetail");
  const slug = slugify(text(formData, "slug") || title);
  if (!title || !excerpt || !rawContent)
    throw new Error("Titre, résumé et contenu sont obligatoires.");
  if (!slug || slug.length > 180)
    throw new Error("L’adresse de l’article est invalide ou trop longue.");
  if (
    title.length > 200 ||
    excerpt.length > 500 ||
    rawContent.length > 50_000
  ) {
    throw new Error(
      "Le titre, le résumé ou le contenu dépasse la limite autorisée.",
    );
  }
  if (byline.length > 120)
    throw new Error("Le nom de l’auteur ne peut pas dépasser 120 caractères.");
  if (activityDetail.length > 280)
    throw new Error(
      "Le détail de la modification ne peut pas dépasser 280 caractères.",
    );
  if (
    status === "scheduled" &&
    (!scheduledDate ||
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate <= new Date())
  ) {
    throw new Error("Choisissez une date de programmation valide et future.");
  }
  if (status === "needs_changes" && !text(formData, "editorialNotes")) {
    throw new Error("Expliquez à l’auteur les modifications demandées.");
  }
  const uploadedImage = await uploadHeroImage(formData, newsroom.user.id);
  const existingImage = text(formData, "existingImage");
  const textFirst = formData.get("textFirst") === "on";
  const heroImageUrl = textFirst
    ? "/brand/logo.svg"
    : uploadedImage || existingImage || null;
  if (heroImageUrl && !isAllowedArticleImageUrl(heroImageUrl)) {
    throw new Error(
      "L’image doit provenir de la bibliothèque Voice of Guinea.",
    );
  }
  const publishedAt =
    status === "published"
      ? publicationTime(
          previous?.data?.published_at,
          text(formData, "publicationDateTime"),
          changePublicationDate,
        )
      : previous?.data?.published_at || null;
  const parsedContent = parseEditorText(
    rawContent,
    readingContent<ContentBlock>(previous?.data?.content ?? []).blocks,
  );
  const content = formData.has("keyPoint1")
    ? [
        ...editorialPoints(
          [1, 2, 3].map((i) => text(formData, `keyPoint${i}`)),
        ),
        ...readingContent(parsedContent).blocks,
      ]
    : parsedContent;
  const payload = {
    title,
    slug,
    byline: byline || null,
    excerpt,
    seo_title: text(formData, "seoTitle") || null,
    seo_description: text(formData, "seoDescription") || null,
    correction_note: text(formData, "correctionNote") || null,
    source_notes: text(formData, "sourceNotes") || null,
    editorial_notes: manager
      ? text(formData, "editorialNotes") || null
      : previous?.data?.editorial_notes || null,
    content,
    hero_image_url: heroImageUrl,
    hero_image_alt: textFirst
      ? "Logo de Voice of Guinea"
      : text(formData, "imageAlt"),
    image_credit: textFirst
      ? "Voice of Guinea — présentation sans photographie"
      : text(formData, "imageCredit") || null,
    image_source_url: textFirst
      ? null
      : externalHttpUrl(text(formData, "imageSourceUrl")),
    image_rights_notes: textFirst
      ? "Présentation sans photographie."
      : text(formData, "imageRightsNotes") || null,
    use_cms_image:
      textFirst ||
      Boolean(uploadedImage) ||
      formData.get("useCmsImage") === "on",
    sources_approved: formData.get("sourcesApproved") === "on",
    rights_approved: textFirst || formData.get("rightsApproved") === "on",
    category_id: text(formData, "categoryId") || null,
    author_id: previous?.data?.author_id || newsroom.user.id,
    status,
    featured: manager && formData.get("featured") === "on",
    published_at: publishedAt,
    scheduled_for: status === "scheduled" ? scheduledDate!.toISOString() : null,
    reviewed_at:
      manager && ["needs_changes", "scheduled", "published"].includes(status)
        ? new Date().toISOString()
        : null,
    reviewed_by:
      manager && ["needs_changes", "scheduled", "published"].includes(status)
        ? newsroom.user.id
        : null,
  };
  if (
    ["published", "scheduled"].includes(status) &&
    (!payload.category_id ||
      !payload.hero_image_url ||
      !payload.hero_image_alt ||
      !payload.image_credit ||
      payload.content.length < 3)
  ) {
    throw new Error(
      "Avant de publier ou programmer, ajoutez une catégorie, au moins trois blocs de contenu, une image, son texte alternatif et son crédit.",
    );
  }

  if (
    ["published", "scheduled"].includes(status) &&
    (!payload.sources_approved ||
      !payload.rights_approved ||
      !approvedSourceUrls(content).length)
  ) {
    throw new Error(
      "Relisez les sources publiques et confirmez les droits avant publication.",
    );
  }
  const result = await newsroom.supabase.rpc("save_newsroom_article", {
    payload,
    article_id: id || null,
    expected_updated_at: id ? expectedUpdatedAt : null,
  });
  if (result.error) throw new Error(result.error.message);
  const savedId = String(result.data);
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
        .eq("entity_id", savedId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activity) {
        const existingDetails =
          activity.details && typeof activity.details === "object"
            ? activity.details
            : {};
        const { error: activityError } = await database
          .from("activity_log")
          .update({ details: { ...existingDetails, note: activityDetail } })
          .eq("id", activity.id);
        if (activityError)
          console.error(
            "Article saved, but its activity note failed.",
            activityError,
          );
      }
    } catch (error) {
      console.error("Article saved, but its activity note failed.", error);
    }
  }

  if (status === "published") after(() => generateSummary(savedId));
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  refreshPublicSite();
  if (status === "published" && previous?.data?.status !== "published") {
    try {
      await sendSocialPackEmail({
        id: savedId,
        title: payload.title,
        excerpt: payload.excerpt,
        slug: payload.slug,
        imageUrl: payload.hero_image_url,
        imageAlt: payload.hero_image_alt,
        imageCredit: payload.image_credit,
      });
    } catch (error) {
      console.error(
        "The article was published, but its social pack email failed.",
        error,
      );
    }
  }
  redirect(`/admin/articles?saved=${id ? "updated" : "created"}`);
}

export async function deleteArticle(formData: FormData) {
  const newsroom = await requireNewsroom(["owner", "editor"]);
  const id = text(formData, "id");
  const { error } = await newsroom.supabase
    .from("articles")
    .update({ status: "archived", featured: false, scheduled_for: null })
    .eq("id", id);
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
  const slug = slugify(text(formData, "slug") || name);
  const displayOrder = Number(text(formData, "displayOrder") || 0);
  if (
    name.length > 80 ||
    !slug ||
    slug.length > 80 ||
    !Number.isInteger(displayOrder)
  ) {
    throw new Error("Vérifiez le nom, l’adresse et l’ordre de la catégorie.");
  }
  if (id) {
    const { data: existing } = await newsroom.supabase
      .from("categories")
      .select("slug")
      .eq("id", id)
      .single();
    if (
      existing &&
      ["actualites", "culture", "divertissement"].includes(existing.slug) &&
      slug !== existing.slug
    )
      throw new Error(
        "L’adresse de cette rubrique principale est permanente. Vous pouvez modifier son nom et sa description.",
      );
  }
  const payload = {
    name,
    slug,
    description: text(formData, "description") || null,
    display_order: displayOrder,
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
  const { error } = await newsroom.supabase
    .from("categories")
    .update({ active: false })
    .eq("id", text(formData, "id"));
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
  if (headline.length > 240)
    throw new Error("Le titre de dernière minute est trop long.");
  if (externalUrl && !safeExternalUrl)
    throw new Error("Le lien externe doit commencer par http:// ou https://.");
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
  const { error } = await newsroom.supabase
    .from("breaking_news")
    .delete()
    .eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/breaking-news");
  refreshPublicSite();
}

export async function importMigratedArticles() {
  await requireNewsroom(["owner"]);
  throw new Error(
    "L’import historique est désactivé. Les archives doivent être vérifiées individuellement avant publication.",
  );
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
  const callback = new URL(
    "/auth/callback",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
  );
  callback.searchParams.set("next", "/admin/setup-password");
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: callback.toString(),
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
  redirect(`/admin/equipe?invite=sent&email=${encodeURIComponent(email)}`);
}

export async function updateTeamMember(formData: FormData) {
  const newsroom = await requireNewsroom(["owner"]);
  const id = text(formData, "id");
  const role = text(formData, "role") as Role;
  const active = formData.get("active") === "on";
  if (id === newsroom.user.id && (!active || role !== "owner")) {
    throw new Error(
      "Vous ne pouvez pas désactiver ou rétrograder votre propre compte propriétaire.",
    );
  }
  if (!["owner", "editor", "author"].includes(role))
    throw new Error("Rôle invalide.");

  const { error } = await newsroom.supabase
    .from("profiles")
    .update({ role, active })
    .eq("id", id);
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
  if (status !== "unsubscribed") {
    throw new Error(
      "Une inscription ne peut devenir active qu’après confirmation par son destinataire.",
    );
  }
  const { error } = await newsroom.supabase
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
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

export async function checkDuePublications() {
  await requireNewsroom(["owner", "editor"]);
  const { runScheduledPublishing } = await import("@/lib/scheduled-publishing");
  await runScheduledPublishing();
  revalidatePath("/admin/systeme");
  redirect("/admin/systeme?checked=1");
}

export async function restoreArticleRevision(formData: FormData) {
  const room = await requireNewsroom(["owner", "editor"]);
  const id = text(formData, "id"),
    revisionId = text(formData, "revisionId");
  const { data: revision, error } = await room.supabase
    .from("article_revisions")
    .select("snapshot")
    .eq("article_id", id)
    .eq("id", revisionId)
    .single();
  if (error || !revision) throw new Error("Version introuvable.");
  const snapshot = revision.snapshot;
  const payload = {
    ...snapshot,
    status: "draft",
    featured: false,
    scheduled_for: null,
    editorial_notes:
      "Version restaurée en brouillon : relecture nécessaire avant republication.",
  };
  const { error: saveError } = await room.supabase.rpc(
    "save_newsroom_article",
    {
      payload,
      article_id: id,
      expected_updated_at: text(formData, "expectedUpdatedAt"),
    },
  );
  if (saveError) throw new Error(saveError.message);
  refreshPublicSite();
  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${id}/edit`);
}

export async function saveArticleFeedback(formData: FormData) {
  try {
    await saveArticle(formData);
  } catch (error) {
    const { unstable_rethrow } = await import("next/navigation");
    unstable_rethrow(error);
    return {
      error:
        error instanceof Error ? error.message : "Enregistrement impossible.",
    };
  }
}
