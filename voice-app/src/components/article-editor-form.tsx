import { ConfirmSubmit } from "./confirm-submit";
import { deleteArticle, saveArticle } from "@/app/admin/(dashboard)/actions";

type CategoryOption = { id: string; name: string };
type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: Array<{ type: string; text?: string }>;
  hero_image_url: string | null;
  hero_image_alt: string;
  image_credit: string | null;
  category_id: string | null;
  status: string;
  featured: boolean;
  scheduled_for: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  correction_note?: string | null;
  source_notes?: string | null;
  editorial_notes?: string | null;
  byline?: string | null;
  published_at?: string | null;
};

type ArticleRevision = {
  id: number;
  revision_number: number;
  created_at: string;
  profiles?: { full_name: string }[] | null;
};

function contentToText(content: ArticleRecord["content"] | null) {
  return (content ?? [])
    .map((block) => block.type === "heading" ? `## ${block.text ?? ""}` : block.text ?? "")
    .filter(Boolean)
    .join("\n\n");
}

export function ArticleEditorForm({
  categories,
  article,
  canPublish,
  revisions = [],
}: {
  categories: CategoryOption[];
  article?: ArticleRecord | null;
  canPublish: boolean;
  revisions?: ArticleRevision[];
}) {
  return (
    <>
    <form action={saveArticle} className="article-editor">
      {article && <input type="hidden" name="id" value={article.id} />}
      <input type="hidden" name="existingImage" value={article?.hero_image_url ?? ""} />
      <section className="editor-main">
        <label className="editor-title">Titre de l’article<input name="title" required defaultValue={article?.title} placeholder="Écrivez un titre clair et précis…" /></label>
        <label>Nom de l’auteur <input name="byline" maxLength={120} defaultValue={article?.byline ?? ""} placeholder="Ex. Aminata Diallo" /><span className="field-help">Visible sur le site. Laissez vide pour afficher Voice of Guinea.</span></label>
        <label>Adresse de l’article<input name="slug" defaultValue={article?.slug} placeholder="Créée automatiquement si elle reste vide" /></label>
        <label>Résumé<textarea name="excerpt" required rows={3} defaultValue={article?.excerpt} placeholder="Le résumé visible sur les cartes et dans les résultats de recherche…" /></label>
        <div className="editor-section-label"><strong>Référencement</strong><span>Laissez vide pour reprendre le titre et le résumé.</span></div>
        <label>Titre SEO<input name="seoTitle" maxLength={70} defaultValue={article?.seo_title ?? ""} placeholder="60 caractères environ" /></label>
        <label>Description SEO<textarea name="seoDescription" maxLength={170} rows={3} defaultValue={article?.seo_description ?? ""} placeholder="Description claire pour Google" /></label>
        <label>
          Contenu
          <textarea name="content" required rows={20} defaultValue={contentToText(article?.content ?? null)} placeholder={"Commencez à écrire…\n\nUtilisez ## devant un intertitre."} />
          <small>Séparez les paragraphes par une ligne vide. Utilisez <code>##</code> pour un intertitre.</small>
        </label>
        <label>Notes de sources <span className="field-help">Interne à la rédaction — liens, contacts, documents et éléments à vérifier.</span><textarea name="sourceNotes" rows={4} defaultValue={article?.source_notes ?? ""} placeholder="Sources, liens, contacts ou éléments à vérifier avant publication…" /></label>
        <label>Détail pour l’activité récente <span className="field-help">Interne à la rédaction. Résumez en une phrase ce qui a changé.</span><textarea name="activityDetail" maxLength={280} rows={3} placeholder="Ex. J’ai corrigé les chiffres et ajouté la déclaration du ministère." /></label>
        <label>Note de correction ou de mise à jour<textarea name="correctionNote" rows={3} defaultValue={article?.correction_note ?? ""} placeholder="Expliquez clairement une correction importante apportée après publication." /></label>
      </section>
      <aside className="editor-sidebar">
        <div className="editor-box">
          <h2>Publication</h2>
          <label>Statut
            <select name="status" defaultValue={article?.status ?? "draft"}>
              <option value="draft">Brouillon</option>
              <option value="in_review">Prêt pour relecture</option>
              {canPublish && <option value="needs_changes">Modifications demandées</option>}
              {canPublish && <option value="published">Publié</option>}
              {canPublish && <option value="scheduled">Programmé</option>}
              {canPublish && <option value="archived">Archivé</option>}
            </select>
          </label>
          {canPublish && <label>Retour à l’auteur <textarea name="editorialNotes" rows={4} defaultValue={article?.editorial_notes ?? ""} placeholder="Commentaires internes ou modifications demandées…" /></label>}
          {canPublish && <label>Date de programmation<input type="datetime-local" name="scheduledFor" defaultValue={article?.scheduled_for?.slice(0, 16)} /></label>}
          {canPublish && <label>Date de publication <input type="date" name="publicationDate" defaultValue={article?.published_at?.slice(0, 10)} /><span className="field-help">Pour une publication immédiate ou une date historique. Pour plus tard, utilisez la programmation.</span></label>}
          {canPublish && <label className="check-row"><input type="checkbox" name="featured" defaultChecked={article?.featured} /> Mettre à la une</label>}
        </div>
        <div className="editor-box publication-checklist">
          <h2>Vérifications avant publication</h2>
          <ul>
            <li>Titre et résumé précis</li>
            <li>Sources relues dans le contenu</li>
            <li>Catégorie sélectionnée</li>
            <li>Image, texte alternatif et crédit</li>
            <li>Noms, dates et chiffres vérifiés</li>
          </ul>
        </div>
        <div className="editor-box">
          <h2>Classement</h2>
          <label>Catégorie
            <select name="categoryId" defaultValue={article?.category_id ?? ""}>
              <option value="">Sans catégorie</option>
              {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
          </label>
        </div>
        <div className="editor-box">
          <h2>Image principale</h2>
          {article?.hero_image_url && <p className="current-image">Image actuelle enregistrée</p>}
          <label className="upload-zone"><input name="heroImage" type="file" accept="image/jpeg,image/png,image/webp" /><strong>Choisir une image</strong><span>JPG, PNG ou WebP · 10 Mo max.</span></label>
          <label>Texte alternatif<input name="imageAlt" defaultValue={article?.hero_image_alt} placeholder="Décrivez ce que montre l’image" /></label>
          <label>Crédit photo<input name="imageCredit" defaultValue={article?.image_credit ?? ""} placeholder="Photographe ou source" /></label>
        </div>
        <button type="submit" className="admin-primary editor-save">{article ? "Enregistrer les modifications" : "Créer l’article"}</button>
      </aside>
    </form>
    {article && revisions.length > 0 && (
      <section className="admin-panel revision-history">
        <div className="admin-panel-heading"><div><span className="admin-kicker">Traçabilité</span><h2>Historique des versions</h2></div></div>
        <ol>
          {revisions.map((revision) => (
            <li key={revision.id}>
              <strong>Version {revision.revision_number}</strong>
              <span>{revision.profiles?.[0]?.full_name || "La rédaction"} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.created_at))}</span>
            </li>
          ))}
        </ol>
      </section>
    )}
    {article && canPublish && (
      <div className="editor-danger-zone">
        <div><strong>Zone sensible</strong><span>La suppression est définitive.</span></div>
        <ConfirmSubmit
          action={deleteArticle}
          message="Supprimer définitivement cet article ?"
          className="danger-button"
          field={{ name: "id", value: article.id }}
        >
          Supprimer l’article
        </ConfirmSubmit>
      </div>
    )}
    </>
  );
}
