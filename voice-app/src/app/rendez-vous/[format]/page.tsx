import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { getPublishedArticles } from "@/lib/content";
import { readingFormats, formatArticles } from "@/lib/reading";
import { formatArticleDate } from "@/lib/articles";

export const revalidate = 60;
export function generateStaticParams() { return readingFormats.map(f => ({ format: f.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ format: string }> }): Promise<Metadata> {
  const { format } = await params;
  const item = readingFormats.find(f => f.slug === format);
  return item ? { title: item.title, description: item.description, alternates: { canonical: `/rendez-vous/${item.slug}` } } : {};
}
export default async function ReadingFormatPage({ params }: { params: Promise<{ format: string }> }) {
  const { format } = await params;
  const item = readingFormats.find(f => f.slug === format);
  if (!item) notFound();
  const now = new Date();
  const articles = formatArticles(format, await getPublishedArticles(), now);
  return <div className="shell section-space collection-page"><header className="collection-header"><span className="section-kicker">À découvrir · {item.label}</span><h1>{item.title}</h1><p className="lead">{item.description}</p>
    {format === "la-semaine-en-guinee" && <p>Du {formatArticleDate(new Date(now.getTime() - 7 * 86400000).toISOString())} au {formatArticleDate(now.toISOString())} · Les articles gardent leur date de publication.</p>}
    <nav className="collection-tabs" aria-label="À découvrir">{readingFormats.map(f => <Link href={`/rendez-vous/${f.slug}`} aria-current={f.slug === format ? "page" : undefined} key={f.slug}>{f.title}</Link>)}</nav></header>
    {articles.length ? <div className="card-grid">{articles.map(a => <ArticleCard article={a} key={a.slug} />)}</div> : <p className="collection-empty">Aucun nouvel article dans cette sélection pour le moment. <Link href="/actualites">Lire les dernières actualités →</Link></p>}
    <aside className="collection-newsletter"><h2>Retrouvez nos sélections par e-mail.</h2><p>L’actualité, les talents et les repères pour comprendre la Guinée.</p><Link className="card-button" href="/newsletter">Découvrir la newsletter →</Link></aside>
  </div>;
}
