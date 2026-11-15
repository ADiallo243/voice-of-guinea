import { notFound } from "next/navigation";
import Link from "next/link";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { mapArticle } from "@/lib/content";
import { ArticleView } from "@/components/article-view";
export const dynamic = "force-dynamic";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = await getNewsroomUser();
  const { data: row, error } = await room!.supabase.rpc(
    "get_newsroom_article",
    { article_id: id },
  );
  if (error || !row) notFound();
  const { data: category } = await room!.supabase
    .from("categories")
    .select("name,slug,active")
    .eq("id", row.category_id)
    .maybeSingle();
  const article = mapArticle({
    ...row,
    published_at: row.published_at || "",
    categories: category,
  });
  return (
    <>
      <p className="admin-flash">
        Aperçu privé de la version enregistrée — statut : {row.status}.{" "}
        <Link href={`/admin/articles/${id}/edit`}>Retour à l’éditeur</Link>.
        Aucun contenu n’est publié par cet aperçu.
      </p>
      <div className="public-site">
        <ArticleView article={article} preview />
      </div>
    </>
  );
}
