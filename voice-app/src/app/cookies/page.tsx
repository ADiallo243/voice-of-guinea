import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-settings-button";

export const metadata: Metadata = {
  title: "Politique cookies",
  description: "Les cookies et traceurs utilisés par Voice of Guinea, et vos choix.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <article className="shell legal-page">
      <header className="legal-header"><span className="section-kicker">Vos choix</span><h1>Cookies et mesure d’audience</h1><p>Dernière mise à jour : 14 novembre 2026</p></header>
      <div className="legal-copy">
        <p className="lead">Vous gardez le contrôle. Refuser la mesure d’audience n’empêche pas de consulter Voice of Guinea.</p>
        <h2>Ce que nous utilisons</h2>
        <table><thead><tr><th>Catégorie</th><th>Finalité</th><th>Choix</th></tr></thead><tbody><tr><td data-label="Catégorie">Essentiels</td><td data-label="Finalité">Sécurité, connexion à l’espace newsroom et conservation de votre choix cookies.</td><td data-label="Choix">Toujours actifs car nécessaires au service demandé.</td></tr><tr><td data-label="Catégorie">Préférences</td><td data-label="Finalité">Conserver localement les articles que vous choisissez de sauvegarder.</td><td data-label="Choix">Créés uniquement lorsque vous utilisez cette fonctionnalité.</td></tr><tr><td data-label="Catégorie">Mesure d’audience</td><td data-label="Finalité">Google Analytics permet de comprendre, de façon agrégée, comment le site est consulté.</td><td data-label="Choix">Uniquement avec votre accord préalable.</td></tr></tbody></table>
        <h2>Préférences de newsletter</h2>
        <p>Le navigateur conserve un indicateur de présentation pour la session, la date de fermeture de l’invitation pendant environ 30 jours, ainsi qu’un indicateur d’inscription demandée ou confirmée. Ces préférences locales évitent de répéter l’invitation ; elles ne contiennent pas votre adresse e-mail. Vous pouvez les supprimer dans les paramètres de votre navigateur.</p>
        <h2>Google Analytics</h2>
        <p>Si vous acceptez, Google Analytics peut déposer et lire des identifiants de mesure d’audience, tels que les cookies <code>_ga</code>. Nous avons désactivé la publicité personnalisée dans l’implémentation du site : les paramètres publicitaires, les données utilisateur publicitaires et la personnalisation publicitaire sont refusés par défaut.</p>
        <h2>Modifier votre choix</h2>
        <p>Votre choix est conservé pendant six mois, puis nous vous le redemanderons. Vous pouvez le modifier immédiatement :</p>
        <CookieSettingsButton />
        <h2>En savoir plus</h2>
        <p>Pour le traitement de données personnelles associé à ces traceurs, consultez notre <Link href="/confidentialite">politique de confidentialité</Link>. Les paramètres de votre navigateur peuvent aussi permettre de supprimer les cookies déjà enregistrés.</p>
      </div>
    </article>
  );
}
