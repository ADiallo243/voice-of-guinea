import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Informations d’édition, d’hébergement et d’utilisation de Voice of Guinea.",
  alternates: { canonical: "/mentions-legales" },
};

export default function LegalNoticePage() {
  return (
    <article className="shell legal-page">
      <header className="legal-header"><span className="section-kicker">Informations légales</span><h1>Mentions légales</h1><p>Dernière mise à jour : 8 septembre 2026</p></header>
      <div className="legal-copy">
        <h2>Édition</h2><p><strong>Nom du média :</strong> {siteConfig.name}<br /><strong>Contact rédaction et données personnelles :</strong> <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><br /><strong>Zone éditoriale :</strong> {siteConfig.location}</p>
        <p>Avant publication, l’éditeur doit compléter cette page avec son identité juridique complète, l’adresse de son siège ou de son domicile professionnel, ainsi que le nom de la personne responsable de la publication lorsque le droit applicable l’exige.</p>
        <h2>Hébergement et services techniques</h2><p>Le site est déployé avec Vercel. Les fonctions éditoriales et le stockage associé utilisent Supabase. Ces prestataires assurent l’infrastructure technique ; ils ne déterminent pas la ligne éditoriale de Voice of Guinea.</p>
        <h2>Propriété intellectuelle</h2><p>Les textes, éléments graphiques, logos et éléments de conception publiés par Voice of Guinea sont protégés par les règles applicables de propriété intellectuelle. Les reproductions, redistributions ou usages au-delà des exceptions prévues par la loi nécessitent une autorisation préalable, sauf indication contraire. Les images de tiers sont utilisées avec le crédit et les droits correspondants ; le crédit ne vaut pas autorisation de réutilisation.</p>
        <h2>Liens et contenus externes</h2><p>Les liens externes sont fournis pour informer les lecteurs. Voice of Guinea ne contrôle pas en permanence ces sites ni leurs politiques de confidentialité ou leurs contenus. L’ouverture d’un lien externe relève du choix du lecteur.</p>
        <h2>Conditions de lecture</h2><p>Le contenu est fourni à des fins d’information. Il ne constitue pas un conseil juridique, médical, financier ou professionnel personnalisé. Pour les règles de publication, consultez nos <Link href="/normes-editoriales">normes éditoriales</Link> et notre procédure de <Link href="/corrections">corrections</Link>.</p>
      </div>
    </article>
  );
}
