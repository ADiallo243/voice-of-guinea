import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Déclaration d’accessibilité",
  description: "L’engagement de Voice of Guinea pour un site d’information accessible à tous.",
  alternates: { canonical: "/accessibilite" },
};

export default function AccessibilityPage() {
  return (
    <article className="shell legal-page">
      <header className="legal-header"><span className="section-kicker">Accessible à tous</span><h1>Déclaration d’accessibilité</h1><p>Dernière mise à jour : 8 septembre 2026</p></header>
      <div className="legal-copy">
        <p className="lead">Voice of Guinea veut permettre à chacun d’accéder à l’information, quels que soient ses capacités, son appareil, sa connexion ou sa technologie d’assistance.</p>
        <h2>Notre objectif</h2><p>Nous visons progressivement les exigences des Règles pour l’accessibilité des contenus Web (WCAG) 2.2, niveau AA. Cette déclaration décrit un engagement et non une certification : une évaluation complète par des utilisateurs et des spécialistes reste à réaliser avant toute affirmation de conformité totale.</p>
        <h2>Mesures déjà prises</h2><ul><li>structure sémantique des pages, titres hiérarchisés et lien d’accès direct au contenu ;</li><li>navigation au clavier et menu mobile annoncé aux technologies d’assistance ;</li><li>textes alternatifs et crédits pour les images éditoriales ;</li><li>respect du réglage système de réduction des animations ;</li><li>mise en page adaptable aux petits écrans.</li></ul>
        <h2>Améliorations en cours</h2><p>Nous continuons à vérifier le contraste, les états de focus, les formulaires, les contenus intégrés, les tableaux, les documents publiés et les parcours avec lecteurs d’écran. Les contenus de partenaires ou les images d’archive peuvent nécessiter une amélioration complémentaire.</p>
        <h2>Nous signaler une difficulté</h2><p>Si vous rencontrez une barrière d’accessibilité, écrivez à <a href="mailto:voiceofguinea@gmail.com?subject=Accessibilit%C3%A9%20-%20Voice%20of%20Guinea">voiceofguinea@gmail.com</a>. Indiquez la page concernée, votre appareil ou navigateur si vous le souhaitez, et ce qui vous empêcherait d’accéder à l’information. Nous chercherons une solution ou une alternative accessible.</p>
      </div>
    </article>
  );
}
