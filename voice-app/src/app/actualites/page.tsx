import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

const baseMetadata: Metadata = {
  title: "Actualités de Guinée",
  description:
    "Suivez les faits marquants économiques, sociaux, culturels et sportifs en Guinée, vérifiés et expliqués clairement.",
  alternates: { canonical: "/actualites" },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const n = Math.max(1, Number(page) || 1);
  return {
    ...baseMetadata,
    alternates: { canonical: "/actualites" + (n > 1 ? `?page=${n}` : "") },
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return <CategoryPage slug="actualites" page={page} />;
}
