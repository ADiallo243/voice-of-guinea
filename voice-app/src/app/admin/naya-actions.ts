"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { contentHash, threePoints } from "@/lib/naya/core";
import { generateSummary } from "@/lib/naya/service";
export async function reviewNaya(form: FormData) {
  const newsroom = await getNewsroomUser();
  if (
    !newsroom?.profile?.active ||
    !["owner", "editor"].includes(newsroom.profile.role)
  )
    throw new Error("Accès refusé.");
  const id = String(form.get("id") || "");
  const action = String(form.get("decision") || "");
  const db = newsroom.supabase;
  const { data: article } = await db
    .from("articles")
    .select("title,excerpt,content,status")
    .eq("id", id)
    .single();
  if (!article || article.status !== "published")
    throw new Error("Article publié requis.");
  const hash = contentHash({
    title: article.title,
    summary: article.excerpt,
    blocks: article.content,
  });
  if (action === "disable" || action === "enable") {
    const { error } = await db
      .from("naya_article_settings")
      .upsert({ article_id: id, disabled: action === "disable" });
    if (error) throw error;
  } else if (action === "generate") {
    const { data: current } = await db
      .from("naya_summaries")
      .select("status")
      .eq("article_id", id)
      .eq("content_hash", hash)
      .maybeSingle();
    if (current?.status === "approved")
      throw new Error("Rejetez le résumé avant de le régénérer.");
    after(() => generateSummary(id, true));
  } else if (action === "approve" || action === "reject") {
    if (form.get("hash") !== hash)
      throw new Error("L’article a changé. Rechargez avant de valider.");
    const points = ["point0", "point1", "point2"].map((k) =>
      String(form.get(k) || "").trim(),
    );
    if (action === "approve" && !threePoints(points))
      throw new Error("Trois phrases de 600 caractères maximum sont requises.");
    const { error } = await db
      .from("naya_summaries")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        approved: action === "approve" ? points : null,
        draft: points,
        approved_at: action === "approve" ? new Date().toISOString() : null,
        reviewer_id: newsroom.user.id,
      })
      .eq("article_id", id)
      .eq("content_hash", hash);
    if (error) throw error;
  } else throw new Error("Action invalide.");
  revalidatePath(`/admin/articles/${id}/edit`);
  revalidatePath("/", "layout");
}
