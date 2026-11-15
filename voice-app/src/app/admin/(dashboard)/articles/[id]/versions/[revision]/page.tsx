import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { editorText, newsroomDate } from "@/lib/newsroom";
import { restoreArticleRevision } from "@/app/admin/(dashboard)/actions";
export default async function Revision({
  params,
}: {
  params: Promise<{ id: string; revision: string }>;
}) {
  const { id, revision } = await params;
  const room = await getNewsroomUser();
  const [{ data: current }, { data: version }] = await Promise.all([
    room!.supabase.rpc("get_newsroom_article", { article_id: id }),
    room!.supabase
      .from("article_revisions")
      .select("snapshot,created_at,revision_number")
      .eq("article_id", id)
      .eq("id", revision)
      .maybeSingle(),
  ]);
  if (!current || !version) notFound();
  const old = version.snapshot;
  return (
    <>
      <header className="admin-header">
        <h1>Comparer la version {version.revision_number}</h1>
        <Link href={`/admin/articles/${id}/edit`}>Retour à l’éditeur</Link>
      </header>
      <p>
        Archive enregistrée le {newsroomDate(version.created_at)}. La
        restauration remet l’article en brouillon et le retire du site jusqu’à
        nouvelle validation.
      </p>
      <div className="dashboard-columns">
        <section className="admin-panel">
          <h2>Version archivée</h2>
          <h3>{old.title}</h3>
          <p>{old.excerpt}</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {editorText(old.content || [])}
          </pre>
        </section>
        <section className="admin-panel">
          <h2>Version actuelle</h2>
          <h3>{current.title}</h3>
          <p>{current.excerpt}</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {editorText(current.content || [])}
          </pre>
        </section>
      </div>
      {["owner", "editor"].includes(room!.profile!.role || "") && (
        <form action={restoreArticleRevision}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="revisionId" value={revision} />
          <input
            type="hidden"
            name="expectedUpdatedAt"
            value={current.updated_at}
          />
          <button className="admin-secondary" type="submit">
            Restaurer en brouillon — relecture obligatoire
          </button>
        </form>
      )}
    </>
  );
}
