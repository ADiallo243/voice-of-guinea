import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Voice of Guinea traite et protège les données personnelles de ses lecteurs.",
  alternates: { canonical: "/confidentialite" },
};

export default function PrivacyPage() {
  return (
    <article className="shell legal-page">
      <header className="legal-header"><span className="section-kicker">Confiance</span><h1>Politique de confidentialité</h1><p>Dernière mise à jour : 8 septembre 2026</p></header>
      <div className="legal-copy">
        <p className="lead">Voice of Guinea respecte la vie privée de ses lecteurs. Cette page explique quelles données sont utilisées, pourquoi, et comment exercer vos choix.</p>
        <h2>Qui est responsable ?</h2>
        <p>Le site Voice of Guinea est édité par Voice of Guinea. Pour toute question relative à vos données ou à cette politique, écrivez à <a href="mailto:voiceofguinea@gmail.com">voiceofguinea@gmail.com</a>.</p>
        <h2>Les données que nous traitons</h2>
        <ul><li><strong>Navigation :</strong> données techniques nécessaires à la sécurité et au bon fonctionnement du site, ainsi que des données d’audience uniquement si vous l’acceptez.</li><li><strong>Newsletter :</strong> votre adresse e-mail, votre statut d’abonnement et les informations nécessaires à la gestion de votre consentement et de votre désabonnement.</li><li><strong>Correspondance :</strong> les informations que vous choisissez de nous envoyer par e-mail, notamment pour une demande, une correction ou un droit de réponse.</li><li><strong>Newsroom :</strong> pour les membres autorisés de l’équipe, les données de compte strictement nécessaires à l’administration éditoriale.</li></ul>
        <h2>Pourquoi nous les utilisons</h2>
        <ul><li>faire fonctionner, sécuriser et améliorer le site ;</li><li>envoyer la newsletter lorsque vous l’avez demandée ;</li><li>répondre à vos messages, demandes de correction ou d’exercice de droits ;</li><li>mesurer l’audience avec Google Analytics, uniquement après votre accord.</li></ul>
        <h2>Prestataires et transferts</h2>
        <p>Nous utilisons des prestataires techniques pour héberger le site, la base éditoriale et les services d’e-mail, notamment Vercel, Supabase, Google Analytics lorsque vous l’acceptez, et le prestataire d’envoi de nos e-mails. Ces services peuvent traiter des données depuis plusieurs pays. Nous limitons l’accès aux données au strict nécessaire et choisissons des prestataires qui proposent des garanties de sécurité adaptées.</p>
        <h2>Durées de conservation</h2>
        <p>Les données de newsletter sont conservées pendant la durée de votre abonnement. Après un désabonnement, nous ne vous envoyons plus d’e-mails et pouvons conserver une preuve minimale de votre choix pendant la durée nécessaire à la gestion des demandes et à nos obligations. Les messages reçus sont conservés le temps de les traiter et d’assurer le suivi nécessaire. Les données d’audience suivent les paramètres de conservation définis dans Google Analytics.</p>
        <h2>Vos choix et vos droits</h2>
        <p>Vous pouvez demander l’accès, la correction ou la suppression de vos données, vous opposer à certains traitements, retirer votre consentement aux cookies et vous désabonner de la newsletter à tout moment. Contactez-nous à l’adresse indiquée ci-dessus. Nous répondrons dans un délai raisonnable et pourrons demander une information minimale afin de vérifier votre identité.</p>
        <h2>Cookies et modifications</h2>
        <p>Les détails sur les traceurs utilisés sont disponibles dans notre <Link href="/cookies">politique cookies</Link>. Nous pouvons mettre cette page à jour si nos services ou nos pratiques évoluent ; la date de mise à jour sera alors modifiée.</p>
      </div>
    </article>
  );
}
