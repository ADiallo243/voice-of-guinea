import { notFound } from "next/navigation";
import { ArticleEditorForm } from "@/components/article-editor-form";
import { getNewsroomUser } from "@/lib/supabase/admin";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const newsroom = await getNewsroomUser();
  const [{ data: article }, { data: categories }] = await Promise.all([
    newsroom!.supabase.from("articles").select("*").eq("id", id).single(),
    newsroom!.supabase.from("categories").select("id, name").order("display_order"),
  ]);
  if (!article) notFound();
  const canPublish = ["owner", "editor"].includes(newsroom?.profile?.role ?? "");

  return (
    <>
      <header className="admin-header editor-header">
        <div><span className="admin-kicker">Modification</span><h1>Modifier l’article</h1><p>Les changements seront enregistrés dans Supabase.</p></div>
      </header>
      <ArticleEditorForm article={article} categories={categories ?? []} canPublish={canPublish} />
    </>
  );
}
