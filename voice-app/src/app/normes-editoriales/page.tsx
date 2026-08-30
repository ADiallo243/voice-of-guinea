import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Normes éditoriales",
  description: "Les principes de vérification, d’indépendance et de transparence qui guident les publications de Voice of Guinea.",
  alternates: { canonical: "/normes-editoriales" },
};

export default function EditorialStandardsPage() {
  return (
    <article className="shell story-page policy-page">
      <span className="section-kicker">Notre méthode</span>
      <h1>Normes éditoriales</h1>
      <div className="story-copy">
        <p className="policy-updated">Dernière mise à jour : 29 août 2026</p>
        <p className="lead">Notre objectif est de publier une information utile, compréhensible et honnête sur ce que nous savons — comme sur ce qui reste incertain.</p>

        <h2>Vérification et attribution</h2>
        <p>Nous cherchons à vérifier les faits auprès de sources fiables et, lorsque cela est pertinent, auprès de plusieurs sources indépendantes. Nous attribuons les affirmations, images et documents à leur origine dès qu’elle peut être rendue publique.</p>

        <h2>Indépendance</h2>
        <p>Les sujets sont choisis pour leur intérêt public ou culturel. Un partenariat, un contenu sponsorisé ou un lien personnel pertinent doit être indiqué clairement afin que le lecteur puisse juger le contenu en connaissance de cause.</p>

        <h2>Équité et prudence</h2>
        <p>Les personnes ou organisations mises en cause doivent pouvoir présenter leur version lorsque le sujet le justifie. Nous évitons les formulations qui transforment une hypothèse, une rumeur ou une accusation en fait établi.</p>

        <h2>Corrections</h2>
        <p>Une erreur factuelle confirmée doit être corrigée avec clarté. Les modifications importantes peuvent être accompagnées d’une note expliquant ce qui a changé. <Link href="/corrections">Voici comment nous signaler une erreur</Link>.</p>
      </div>
    </article>
  );
}
