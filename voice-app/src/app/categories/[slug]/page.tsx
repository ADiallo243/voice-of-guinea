import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CategoryPage } from "@/components/category-page";
import { categoryPath } from "@/lib/newsroom";
import { getPublicCategories } from "@/lib/content";
async function find(slug: string) {
  return (await getPublicCategories()).find((c) => c.slug === slug);
}
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await find(slug);
  if (!category) return {};
  const { page } = await searchParams;
  const n = Math.max(1, Number(page) || 1);
  return {
    title: category.name,
    description:
      category.description || `Les publications de ${category.name}.`,
    alternates: { canonical: categoryPath(slug) + (n > 1 ? `?page=${n}` : "") },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  if (!(await find(slug))) notFound();
  if (["actualites", "culture", "divertissement"].includes(slug))
    permanentRedirect(categoryPath(slug));
  return <CategoryPage slug={slug} page={(await searchParams).page} />;
}
