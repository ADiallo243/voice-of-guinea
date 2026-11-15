import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

const baseMetadata: Metadata = {
  title: "Divertissement en Guinée",
  description:
    "Musique, cinéma, tendances et talents à suivre sur la scène guinéenne.",
  alternates: { canonical: "/divertissement" },
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
    alternates: { canonical: "/divertissement" + (n > 1 ? `?page=${n}` : "") },
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return <CategoryPage slug="divertissement" page={page} />;
}
