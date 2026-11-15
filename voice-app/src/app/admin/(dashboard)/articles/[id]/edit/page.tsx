import { NayaReview } from "@/components/naya-review";
import { notFound } from "next/navigation";
import { approvedSourceUrls } from "@/lib/newsroom";
import { mapArticle } from "@/lib/content";
import type { ArticleRecord } from "@/components/article-editor-form";
import { ArticleEditorForm } from "@/components/article-editor-form";
import { getNewsroomUser } from "@/lib/supabase/admin";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const newsroom = await getNewsroomUser();
  const [{ data: article }, { data: categories }, { data: revisions }] =
    await Promise.all([
      newsroom!.supabase.rpc("get_newsroom_article", { article_id: id }),
      newsroom!.supabase
        .from("categories")
        .select("id, name, slug, active")
        .order("display_order"),
      newsroom!.supabase
        .from("article_revisions")
        .select("id, revision_number, created_at, profiles(full_name)")
        .eq("article_id", id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
  if (!article) notFound();
  const record = article as ArticleRecord;
  const effectiveArticle = mapArticle({
    ...record,
    published_at: record.published_at || "",
    categories: categories?.find((c) => c.id === record.category_id) || null,
  });
  const canPublish = ["owner", "editor"].includes(
    newsroom?.profile?.role ?? "",
  );

  return (
    <>
      <header className="admin-header editor-header">
        <div>
          <span className="admin-kicker">Modification</span>
          <h1>Modifier l’article</h1>
          <p>Les changements seront enregistrés dans Supabase.</p>
        </div>
      </header>
      {record.status === "published" &&
        !approvedSourceUrls(record.content).length && (
          <p role="alert" className="admin-flash">
            Archive à revoir : aucune section Sources exploitable. Ajoutez des
            preuves avant de valider une nouvelle publication ou correction.
          </p>
        )}
      {canPublish && <NayaReview article={record} />}
      <ArticleEditorForm
        article={record}
        effectiveArticle={effectiveArticle}
        categories={categories ?? []}
        canPublish={canPublish}
        revisions={revisions ?? []}
      />
    </>
  );
}
