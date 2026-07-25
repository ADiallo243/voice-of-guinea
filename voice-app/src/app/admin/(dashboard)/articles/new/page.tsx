import { ArticleEditorForm } from "@/components/article-editor-form";
import { getNewsroomUser } from "@/lib/supabase/admin";

export default async function NewArticlePage() {
  const newsroom = await getNewsroomUser();
  const { data: categories } = await newsroom!.supabase.from("categories").select("id, name").eq("active", true).order("display_order");
  const canPublish = ["owner", "editor"].includes(newsroom?.profile?.role ?? "");

  return (
    <>
      <header className="admin-header editor-header">
        <div><span className="admin-kicker">Nouvelle publication</span><h1>Créer un article</h1><p>Enregistrez un brouillon, publiez maintenant ou programmez sa sortie.</p></div>
      </header>
      <ArticleEditorForm categories={categories ?? []} canPublish={canPublish} />
    </>
  );
}
