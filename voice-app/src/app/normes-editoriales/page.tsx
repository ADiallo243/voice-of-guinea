import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Normes éditoriales",
  description: "Les principes d’indépendance, d’exactitude et de transparence de Voice of Guinea.",
  alternates: { canonical: "/normes-editoriales" },
};

export default function EditorialStandardsPage() {
  return (
    <article className="shell legal-page">
      <header className="legal-header"><span className="section-kicker">Notre engagement</span><h1>Normes éditoriales</h1><p>Dernière mise à jour : 8 septembre 2026</p></header>
      <div className="legal-copy">
        <p className="lead">Voice of Guinea cherche à informer avec exactitude, indépendance et respect des personnes. Ces règles guident la publication de chaque contenu.</p>
        <h2>Exactitude et contexte</h2><p>Nous vérifions les faits, les noms, les dates et les chiffres avant publication. Nous distinguons les faits établis, les déclarations attribuées, les analyses et les opinions. Lorsqu’une information ne peut pas être confirmée de manière indépendante, nous le signalons clairement.</p>
        <h2>Sources et transparence</h2><p>Nous privilégions les sources directes et identifiables. Nous protégeons l’identité d’une source confidentielle seulement lorsqu’un intérêt journalistique clair le justifie et après avoir évalué les risques. Nous indiquons les sources, documents et crédits d’images lorsque cela est possible et pertinent.</p>
        <h2>Indépendance</h2><p>Les intérêts politiques, économiques, personnels ou institutionnels ne doivent pas dicter notre couverture. Tout contenu sponsorisé, partenariat rémunéré, lien d’affiliation ou soutien matériel susceptible d’influencer la perception éditoriale doit être identifié de façon claire pour les lecteurs.</p>
        <h2>Dignité et sécurité</h2><p>Nous cherchons à éviter le sensationnalisme, la discrimination, le harcèlement et l’exposition inutile de personnes vulnérables. Les images ou descriptions potentiellement choquantes ne sont publiées que lorsqu’elles apportent un véritable intérêt d’information, avec le contexte nécessaire.</p>
        <h2>Outils numériques et intelligence artificielle</h2><p>Les outils numériques peuvent aider à rechercher, transcrire, traduire ou préparer un contenu. Ils ne remplacent pas la responsabilité éditoriale : un membre de la rédaction vérifie les informations importantes avant publication et ne présente pas un contenu synthétique comme un fait vérifié.</p>
        <h2>Corrections et droit de réponse</h2><p>Lorsque nous commettons une erreur substantielle, nous la corrigeons avec transparence. Consultez notre <Link href="/corrections">procédure de corrections et de droit de réponse</Link>.</p>
      </div>
    </article>
  );
}
