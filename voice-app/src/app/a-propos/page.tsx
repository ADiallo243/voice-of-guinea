import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "À propos" };

export default function AboutPage() {
  return (
    <div className="shell story-page">
      <span className="section-kicker">Notre histoire</span>
      <h1>Une voix pour mieux comprendre la Guinée.</h1>
      <div className="story-copy">
        <p className="lead">Voice of Guinea est un média numérique indépendant consacré à l’actualité, la culture et aux talents guinéens.</p>
        <p>Notre ambition est simple : publier une information accessible, utile et proche des réalités quotidiennes. Nous voulons aller au-delà des titres, ajouter du contexte et ouvrir une fenêtre sur les initiatives qui transforment le pays.</p>
        <p>Depuis la Guinée et sa diaspora, nous construisons un espace où les histoires locales peuvent voyager sans perdre leur vérité.</p>
      </div>
      <Link href="/contact" className="button">Nous contacter</Link>
    </div>
  );
}
