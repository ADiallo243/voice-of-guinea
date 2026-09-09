import { ConfirmSubmit } from "@/components/confirm-submit";
import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { deleteBreakingNews, saveBreakingNews } from "../actions";

export default async function BreakingNewsAdminPage() {
  const newsroom = await getNewsroomUser();
  if (!newsroom?.profile?.role || !["owner", "editor"].includes(newsroom.profile.role)) redirect("/admin");
  const [{ data: headlines }, { data: articles }] = await Promise.all([
    newsroom!.supabase.from("breaking_news").select("*, articles(title)").order("display_order"),
    newsroom!.supabase.from("articles").select("id, title").eq("status", "published").order("published_at", { ascending: false }),
  ]);

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Bandeau défilant</span><h1>Dernière minute</h1><p>Rendez chaque information cliquable et contrôlez sa durée d’affichage.</p></div>
      </header>
      <div className="category-admin-grid breaking-grid">
        <section className="admin-panel category-list">
          <div className="admin-panel-heading"><div><span className="admin-kicker">En ligne</span><h2>Informations défilantes</h2></div></div>
          {headlines?.length ? headlines.map((item) => (
            <details key={item.id} className="category-editor">
              <summary>
                <div><strong>{item.headline}</strong><span>Position {item.display_order} · {item.articles?.[0]?.title || item.external_url}</span></div>
                <span className={`status ${item.active ? "active" : "archived"}`}>{item.active ? "Active" : "Inactive"}</span>
              </summary>
              <form action={saveBreakingNews} className="category-form">
                <input type="hidden" name="id" value={item.id} />
                <label>Texte<input name="headline" defaultValue={item.headline} required /></label>
                <label>Article lié<select name="articleId" defaultValue={item.article_id ?? ""}><option value="">Lien externe</option>{(articles ?? []).map((article) => <option value={article.id} key={article.id}>{article.title}</option>)}</select></label>
                <label>Lien externe<input name="externalUrl" type="url" defaultValue={item.external_url ?? ""} placeholder="https://…" /></label>
                <label>Ordre<input name="displayOrder" type="number" defaultValue={item.display_order} /></label>
                <label>Expiration<input name="expiresAt" type="datetime-local" defaultValue={item.expires_at?.slice(0, 16)} /></label>
                <label className="check-row"><input name="active" type="checkbox" defaultChecked={item.active} /> Active</label>
                <button className="admin-primary" type="submit">Enregistrer</button>
              </form>
              <ConfirmSubmit action={deleteBreakingNews} message="Supprimer cette information du bandeau ?" className="danger-link" field={{ name: "id", value: item.id }}>Supprimer</ConfirmSubmit>
            </details>
          )) : <div className="admin-empty"><strong>Aucune information active.</strong><p>Ajoutez la première information avec le formulaire.</p></div>}
        </section>
        <section className="admin-panel new-category">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Nouveau</span><h2>Ajouter au bandeau</h2></div></div>
          <form action={saveBreakingNews} className="category-form">
            <label>Texte court<input name="headline" required placeholder="La nouvelle à afficher…" /></label>
            <label>Article lié<select name="articleId"><option value="">Choisir un article</option>{(articles ?? []).map((article) => <option value={article.id} key={article.id}>{article.title}</option>)}</select></label>
            <label>Ou lien externe<input name="externalUrl" type="url" placeholder="https://…" /></label>
            <label>Ordre<input name="displayOrder" type="number" defaultValue={(headlines?.length ?? 0) + 1} /></label>
            <label>Expiration facultative<input name="expiresAt" type="datetime-local" /></label>
            <label className="check-row"><input name="active" type="checkbox" defaultChecked /> Active immédiatement</label>
            <button className="admin-primary" type="submit">Ajouter au bandeau</button>
          </form>
        </section>
      </div>
    </>
  );
}
