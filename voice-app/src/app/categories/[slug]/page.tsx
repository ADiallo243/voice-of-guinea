import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/category-page";
import { categoryHref } from "@/components/article-card";
import { getPublishedArticles } from "@/lib/content";

async function findCategory(slug: string) {
  const categories = [...new Set((await getPublishedArticles()).map((article) => article.category))];
  return categories.find((category) => categoryHref(category) === `/categories/${slug}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) return {};
  return {
    title: category,
    description: `Les dernières actualités et publications de la rubrique ${category} sur Voice of Guinea.`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function DynamicCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await findCategory(slug);
  if (!category) notFound();
  return <CategoryPage category={category} intro={`Toutes les publications de la rubrique ${category}.`} />;
}
