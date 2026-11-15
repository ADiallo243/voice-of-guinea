import { contentHash } from "@/lib/naya/core";
import { reviewNaya } from "@/app/admin/naya-actions";
import { getNewsroomUser } from "@/lib/supabase/admin";
export async function NayaReview({
  article,
}: {
  article: {
    id: string;
    title: string;
    excerpt: string;
    content: { type: string; text?: string }[];
  };
}) {
  if (
    process.env.NAYA_SUMMARIES_ENABLED !== "true" &&
    process.env.NAYA_CHAT_ENABLED !== "true"
  )
    return null;
  const newsroom = await getNewsroomUser();
  if (
    !newsroom?.profile?.active ||
    !["owner", "editor"].includes(newsroom.profile.role || "")
  )
    return null;
  const hash = contentHash({
    title: article.title,
    summary: article.excerpt,
    blocks: article.content,
  });
  const { data: summary, error } = await newsroom.supabase
    .from("naya_summaries")
    .select("draft,status,content_hash,approved,created_at")
    .eq("article_id", article.id)
    .eq("content_hash", hash)
    .maybeSingle();
  if (error) return <p>Naya : migration ou connexion indisponible.</p>;
  const { data: settings } = await newsroom.supabase
    .from("naya_article_settings")
    .select("disabled")
    .eq("article_id", article.id)
    .maybeSingle();
  const points = summary?.draft || summary?.approved || ["", "", ""];
  return (
    <section className="naya">
      <h2>Naya · Validation éditoriale</h2>
      <p>
        État de cette version : {summary?.status || "aucun résumé à jour"}.
        Rechargez après une génération. Vérifiez les faits et les nuances avant
        toute approbation.
      </p>
      <form action={reviewNaya}>
        <input type="hidden" name="id" value={article.id} />
        <input type="hidden" name="hash" value={hash} />
        {[0, 1, 2].map((i) => (
          <label key={i}>
            Point {i + 1}
            <textarea
              name={`point${i}`}
              defaultValue={points[i]}
              maxLength={600}
              rows={3}
            />
          </label>
        ))}
        <div className="naya-suggestions">
          <button name="decision" value="approve" disabled={!summary}>
            Approuver les modifications
          </button>
          <button name="decision" value="reject" disabled={!summary}>
            Rejeter
          </button>
          <button
            name="decision"
            value="generate"
            disabled={summary?.status === "approved"}
          >
            Générer / régénérer
          </button>
          <button
            name="decision"
            value={settings?.disabled ? "enable" : "disable"}
          >
            {settings?.disabled ? "Activer Naya" : "Désactiver Naya"}
          </button>
        </div>
      </form>
    </section>
  );
}
