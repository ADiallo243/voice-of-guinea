import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corrections et droit de réponse",
  description: "Comment signaler une erreur ou demander un droit de réponse à Voice of Guinea.",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  return (
    <article className="shell legal-page">
      <header className="legal-header"><span className="section-kicker">Redevabilité</span><h1>Corrections et droit de réponse</h1><p>Dernière mise à jour : 8 septembre 2026</p></header>
      <div className="legal-copy">
        <p className="lead">La précision est une responsabilité continue. Si une publication contient une erreur, nous voulons la connaître et la corriger de manière visible.</p>
        <h2>Signaler une erreur</h2><p>Écrivez à <a href="mailto:voiceofguinea@gmail.com?subject=Correction%20-%20Voice%20of%20Guinea">voiceofguinea@gmail.com</a> avec l’objet « Correction », le lien de l’article, l’information concernée et, si possible, une source permettant de vérifier votre signalement.</p>
        <h2>Notre procédure</h2><ol><li>Nous examinons la demande et vérifions les éléments disponibles.</li><li>Si une erreur factuelle substantielle est confirmée, nous corrigeons l’article dans les meilleurs délais.</li><li>Lorsqu’une correction est importante pour la compréhension du sujet, nous ajoutons une note de rédaction précisant la nature de la mise à jour.</li><li>Si nous ne modifions pas l’article, nous pouvons expliquer notre décision lorsque la demande contient des coordonnées permettant une réponse.</li></ol>
        <h2>Droit de réponse</h2><p>Les personnes ou organisations directement mises en cause peuvent demander un droit de réponse. Nous examinons les demandes de bonne foi, dans le respect du droit applicable, de la longueur raisonnable et de notre indépendance éditoriale.</p>
        <h2>Urgence et sécurité</h2><p>Pour un contenu susceptible de créer un risque immédiat pour une personne, indiquez clairement « Urgent » dans l’objet de votre message et expliquez le risque. Cela ne garantit pas un retrait, mais permet une évaluation prioritaire.</p>
      </div>
    </article>
  );
}
