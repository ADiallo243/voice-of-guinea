import Image from "next/image";
import { EditorSaveForm } from "./editor-save-form";
import Link from "next/link";
import {
  editorText,
  localSchedule,
  newsroomDate,
  relationOne,
} from "@/lib/newsroom";
import type { PublicArticle } from "@/lib/content";
import type { ContentBlock } from "@/lib/articles";
import { EditorImageMode } from "./editor-image-mode";
import { readingContent } from "@/lib/reading";
import { ConfirmSubmit } from "./confirm-submit";
import { deleteArticle } from "@/app/admin/(dashboard)/actions";

type CategoryOption = { id: string; name: string };
export type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: ContentBlock[];
  updated_at: string;
  reviewed_at?: string | null;
  image_source_url?: string | null;
  image_rights_notes?: string | null;
  use_cms_image?: boolean;
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

export function ArticleEditorForm({
  categories,
  article,
  canPublish,
  revisions = [],
  effectiveArticle,
}: {
  categories: CategoryOption[];
  article?: ArticleRecord | null;
  canPublish: boolean;
  revisions?: ArticleRevision[];
  effectiveArticle?: PublicArticle;
}) {
  const reading = readingContent(article?.content ?? []);
  return (
    <>
      <EditorSaveForm>
        {article && (
          <>
            <input type="hidden" name="id" value={article.id} />
            <input
              type="hidden"
              name="expectedUpdatedAt"
              value={article.updated_at}
            />
          </>
        )}
        <input
          type="hidden"
          name="existingImage"
          value={article?.hero_image_url ?? ""}
        />
        <section className="editor-main">
          <label className="editor-title">
            Titre de l’article
            <input
              name="title"
              required
              defaultValue={article?.title}
              placeholder="Écrivez un titre clair et précis…"
            />
            <span className="field-help">
              Placez le fait ou la question utile au début. Gardez les réserves
              : une annonce n’est pas une réalisation.
            </span>
          </label>
          <label>
            Nom de l’auteur{" "}
            <input
              name="byline"
              maxLength={120}
              defaultValue={article?.byline ?? ""}
              placeholder="Ex. Aminata Diallo"
            />
            <span className="field-help">
              Visible sur le site. Laissez vide pour afficher Voice of Guinea.
            </span>
          </label>
          <label>
            Adresse de l’article
            <input
              name="slug"
              defaultValue={article?.slug}
              placeholder="Créée automatiquement si elle reste vide"
            />
          </label>
          <label>
            Résumé
            <textarea
              name="excerpt"
              required
              rows={3}
              defaultValue={article?.excerpt}
              placeholder="Le résumé visible sur les cartes et dans les résultats de recherche…"
            />
          </label>
          <div className="editor-section-label">
            <strong>Référencement</strong>
            <span>Laissez vide pour reprendre le titre et le résumé.</span>
          </div>
          <label>
            Titre SEO
            <input
              name="seoTitle"
              maxLength={200}
              defaultValue={article?.seo_title ?? ""}
              placeholder="60 caractères environ"
            />
          </label>
          <label>
            Description SEO
            <textarea
              name="seoDescription"
              maxLength={500}
              rows={3}
              defaultValue={article?.seo_description ?? ""}
              placeholder="Description claire pour Google"
            />
          </label>
          <fieldset className="editor-key-points">
            <legend>L’essentiel en 3 points</legend>
            <p>
              Trois phrases factuelles tirées de l’article. Aucun ajout
              automatique. Laissez les trois champs vides pour masquer cet
              encadré.
            </p>
            {[0, 1, 2].map((i) => (
              <label key={i}>
                Point {i + 1}
                <input
                  name={`keyPoint${i + 1}`}
                  maxLength={280}
                  defaultValue={reading.points[i] || ""}
                />
              </label>
            ))}
          </fieldset>
          <label>
            Contenu
            <textarea
              name="content"
              required
              rows={20}
              defaultValue={editorText(reading.blocks)}
              placeholder={
                "Commencez à écrire…\n\nUtilisez ## devant un intertitre."
              }
            />
            <small>
              Séparez les paragraphes par une ligne vide. Utilisez{" "}
              <code>##</code> pour un intertitre. Conservez les repères
              [[image:…]] des images intégrées.
            </small>
          </label>
          <label>
            Notes de sources{" "}
            <span className="field-help">
              Interne à la rédaction — liens, contacts, documents et éléments à
              vérifier.
            </span>
            <textarea
              name="sourceNotes"
              rows={4}
              defaultValue={article?.source_notes ?? ""}
              placeholder="Sources, liens, contacts ou éléments à vérifier avant publication…"
            />
          </label>
          <label>
            Détail pour l’activité récente{" "}
            <span className="field-help">
              Interne à la rédaction. Résumez en une phrase ce qui a changé.
            </span>
            <textarea
              name="activityDetail"
              maxLength={280}
              rows={3}
              placeholder="Ex. J’ai corrigé les chiffres et ajouté la déclaration du ministère."
            />
          </label>
          <label>
            Note de correction ou de mise à jour
            <textarea
              name="correctionNote"
              rows={3}
              defaultValue={article?.correction_note ?? ""}
              placeholder="Expliquez clairement une correction importante apportée après publication."
            />
          </label>
        </section>
        <aside className="editor-sidebar">
          <div className="editor-box">
            <h2>Publication</h2>
            <label>
              Statut
              <select name="status" defaultValue={article?.status ?? "draft"}>
                <option value="draft">Brouillon</option>
                <option value="in_review">Prêt pour relecture</option>
                {canPublish && (
                  <option value="needs_changes">Modifications demandées</option>
                )}
                {canPublish && <option value="published">Publié</option>}
                {canPublish && <option value="scheduled">Programmé</option>}
                {canPublish && <option value="archived">Archivé</option>}
              </select>
            </label>
            {canPublish && (
              <label>
                Retour à l’auteur{" "}
                <textarea
                  name="editorialNotes"
                  rows={4}
                  defaultValue={article?.editorial_notes ?? ""}
                  placeholder="Commentaires internes ou modifications demandées…"
                />
              </label>
            )}
            {canPublish && (
              <label>
                Date de programmation — America/Toronto
                <input
                  type="datetime-local"
                  name="scheduledFor"
                  defaultValue={localSchedule(article?.scheduled_for)}
                />
                <span className="field-help">
                  Contrôle quotidien existant à 06 h UTC (01 h à Toronto en
                  novembre). Une échéance après ce passage attend le prochain
                  contrôle. L’heure effective est enregistrée à la publication.
                </span>
              </label>
            )}
            {article?.published_at && (
              <p>
                Première publication : {newsroomDate(article.published_at)}.
                Conservée à l’enregistrement.
              </p>
            )}
            {canPublish && (
              <details>
                <summary>
                  Corriger exceptionnellement la date de publication
                </summary>
                <label className="check-row">
                  <input type="checkbox" name="changePublicationDate" />
                  Modifier volontairement la date (justification obligatoire)
                </label>
                <label>
                  Date et heure — Toronto
                  <input
                    type="datetime-local"
                    name="publicationDateTime"
                    defaultValue={localSchedule(article?.published_at)}
                  />
                </label>
              </details>
            )}
            {article && (
              <p>
                <Link
                  href={`/admin/articles/${article.id}/preview`}
                  target="_blank"
                >
                  Aperçu protégé de la version enregistrée →
                </Link>
              </p>
            )}
            {canPublish && (
              <label className="check-row">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={article?.featured}
                />{" "}
                Mettre à la une
              </label>
            )}
          </div>
          <div className="editor-box publication-checklist">
            <h2>Vérifications avant publication</h2>
            <ul>
              <li>Titre et résumé précis</li>
              <li>Sources relues et liens présents dans le contenu</li>
              <li>Catégorie sélectionnée</li>
              <li>Image, texte alternatif et crédit</li>
              <li>Noms, dates et chiffres vérifiés</li>
            </ul>
            <label className="check-row">
              <input
                type="checkbox"
                name="sourcesApproved"
                defaultChecked={Boolean(article?.reviewed_at)}
              />
              J’ai vérifié les faits et les sources publiques de cette version.
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                name="rightsApproved"
                defaultChecked={Boolean(article?.reviewed_at)}
              />
              Les droits du visuel sont documentés, ou la présentation est sans
              photographie.
            </label>
          </div>
          <div className="editor-box">
            <h2>Classement</h2>
            <label>
              Catégorie
              <select
                name="categoryId"
                defaultValue={article?.category_id ?? ""}
              >
                <option value="">Sans catégorie</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="editor-box">
            <h2>Image principale</h2>
            <EditorImageMode
              textFirst={article?.hero_image_url === "/brand/logo.svg"}
            />
            {effectiveArticle && (
              <div className="effective-image">
                <strong>Rendu réellement utilisé sur le site</strong>
                {effectiveArticle.image !== "/brand/logo.svg" ? (
                  <Image
                    src={
                      effectiveArticle.image.startsWith("/editorial-image/")
                        ? "/brand/logo.svg"
                        : effectiveArticle.image
                    }
                    alt={effectiveArticle.imageAlt}
                    unoptimized
                    width={260}
                    height={170}
                    style={{ objectFit: "contain", maxWidth: "100%" }}
                  />
                ) : (
                  <p>Présentation textuelle.</p>
                )}
                <small>{effectiveArticle.imageCredit}</small>
                {effectiveArticle.imageSourceUrl && (
                  <p>
                    <a
                      href={effectiveArticle.imageSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Source du visuel →
                    </a>
                  </p>
                )}
              </div>
            )}
            <label className="check-row">
              <input
                name="useCmsImage"
                type="checkbox"
                defaultChecked={article?.use_cms_image}
              />
              Utiliser l’image enregistrée ici plutôt que le remplacement
              éditorial historique
            </label>
            {article?.hero_image_url && (
              <p className="current-image">Image actuelle enregistrée</p>
            )}
            <label className="upload-zone">
              <input
                name="heroImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
              <strong>Choisir une image</strong>
              <span>JPG, PNG ou WebP · 10 Mo max.</span>
            </label>
            <label>
              Texte alternatif
              <input
                name="imageAlt"
                defaultValue={article?.hero_image_alt}
                placeholder="Décrivez ce que montre l’image"
              />
            </label>
            <label>
              Crédit photo
              <input
                name="imageCredit"
                defaultValue={article?.image_credit ?? ""}
                placeholder="Photographe ou source"
              />
            </label>
            <label>
              URL source de l’image
              <input
                name="imageSourceUrl"
                type="url"
                defaultValue={
                  article?.image_source_url ||
                  effectiveArticle?.imageSourceUrl ||
                  ""
                }
              />
            </label>
            <label>
              Licence ou autorisation — note privée
              <textarea
                name="imageRightsNotes"
                rows={4}
                defaultValue={
                  article?.image_rights_notes ||
                  (effectiveArticle?.imageSourceUrl
                    ? `Registre éditorial existant : ${effectiveArticle.imageCredit}. Source : ${effectiveArticle.imageSourceUrl}`
                    : "")
                }
                placeholder="Titulaire, licence ou autorisation, date et référence de la preuve."
              />
            </label>
          </div>
          <button type="submit" className="admin-primary editor-save">
            {article ? "Enregistrer les modifications" : "Créer l’article"}
          </button>
        </aside>
      </EditorSaveForm>
      {article && revisions.length > 0 && (
        <section className="admin-panel revision-history">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-kicker">Traçabilité</span>
              <h2>Historique des versions</h2>
            </div>
          </div>
          <ol>
            {revisions.map((revision) => (
              <li key={revision.id}>
                <Link
                  href={`/admin/articles/${article!.id}/versions/${revision.id}`}
                >
                  <strong>
                    Version {revision.revision_number} — comparer / restaurer
                  </strong>
                </Link>
                <span>
                  {relationOne(revision.profiles)?.full_name || "La rédaction"}{" "}
                  ·{" "}
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(revision.created_at))}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {article && canPublish && (
        <div className="editor-danger-zone">
          <div>
            <strong>Archivage</strong>
            <span>
              Retire l’article du site tout en conservant son historique.
            </span>
          </div>
          <ConfirmSubmit
            action={deleteArticle}
            message="Archiver cet article et le retirer du site public ?"
            className="danger-button"
            field={{ name: "id", value: article.id }}
          >
            Archiver l’article
          </ConfirmSubmit>
        </div>
      )}
    </>
  );
}
