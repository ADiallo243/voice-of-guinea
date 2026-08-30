import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Découvrez comment Voice of Guinea traite les données liées à la newsletter, aux statistiques de fréquentation et aux demandes de contact.",
  alternates: { canonical: "/confidentialite" },
};

export default function PrivacyPage() {
  return (
    <article className="shell story-page policy-page">
      <span className="section-kicker">Transparence</span>
      <h1>Politique de confidentialité</h1>
      <div className="story-copy">
        <p className="policy-updated">Dernière mise à jour : 29 août 2026</p>
        <p className="lead">Voice of Guinea limite la collecte de données à ce qui est utile au fonctionnement du média et vous laisse choisir l’utilisation des statistiques d’audience.</p>

        <h2>Statistiques d’audience</h2>
        <p>Google Analytics n’est chargé qu’après votre accord dans le bandeau de confidentialité. Si vous refusez, le site reste pleinement accessible. Votre choix est enregistré dans le stockage local de votre navigateur afin de ne pas vous reposer la question à chaque visite. Vous pouvez le modifier à tout moment avec le lien « Gérer mes préférences » en bas de page.</p>

        <h2>Newsletter</h2>
        <p>Lorsque vous vous abonnez, nous enregistrons votre adresse e-mail afin d’envoyer la newsletter. Vous pouvez vous désabonner à tout moment au moyen du lien prévu dans nos messages. Nous ne vendons pas cette adresse.</p>

        <h2>Contact et données techniques</h2>
        <p>Si vous nous écrivez, nous utilisons les informations fournies uniquement pour traiter votre demande. Notre hébergeur et nos prestataires techniques peuvent également traiter les données strictement nécessaires à la sécurité et à la livraison du site.</p>

        <h2>Vos choix</h2>
        <p>Vous pouvez demander l’accès, la correction ou la suppression des informations que vous nous avez confiées en écrivant à <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. Pour toute question éditoriale, consultez aussi notre <Link href="/corrections">politique de corrections</Link>.</p>
      </div>
    </article>
  );
}
