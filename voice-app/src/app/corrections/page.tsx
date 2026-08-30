import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corrections et droit de réponse",
  description: "Signalez une erreur ou demandez un droit de réponse à la rédaction de Voice of Guinea.",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  const subject = encodeURIComponent("Correction — titre ou URL de l’article");

  return (
    <article className="shell story-page policy-page">
      <span className="section-kicker">Responsabilité</span>
      <h1>Corrections et droit de réponse</h1>
      <div className="story-copy">
        <p className="policy-updated">Dernière mise à jour : 29 août 2026</p>
        <p className="lead">Vous avez repéré une erreur factuelle, une image mal attribuée ou un élément important qui manque de contexte ? Prévenez-nous.</p>

        <h2>Comment nous écrire</h2>
        <p>Envoyez le lien de l’article, le passage concerné, la correction proposée et, si possible, une source vérifiable. Écrivez à <a href={`mailto:${siteConfig.email}?subject=${subject}`}>{siteConfig.email}</a>.</p>

        <h2>Notre traitement</h2>
        <p>La rédaction examine le signalement et vérifie les éléments disponibles. Si une erreur est confirmée, nous corrigeons le contenu. Lorsqu’une modification change substantiellement le sens de l’article, une note de correction peut préciser la nature du changement.</p>

        <h2>Droit de réponse</h2>
        <p>Une personne ou organisation directement concernée par une publication peut demander que sa position soit examinée. La demande doit identifier précisément le contenu et présenter une réponse factuelle, proportionnée et vérifiable.</p>
      </div>
    </article>
  );
}
