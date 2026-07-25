import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell empty-state not-found">
      <span>404</span>
      <h1>Cette page est introuvable.</h1>
      <p>Le contenu a peut-être été déplacé ou n’est plus disponible.</p>
      <Link href="/" className="button">Retour à l’accueil</Link>
    </div>
  );
}
