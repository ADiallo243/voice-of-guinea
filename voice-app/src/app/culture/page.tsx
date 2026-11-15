import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

const baseMetadata: Metadata = {
  title: "Culture guinéenne",
  description:
    "Découvrez la culture, le patrimoine, les artistes et les idées qui font vivre la Guinée.",
  alternates: { canonical: "/culture" },
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
    alternates: { canonical: "/culture" + (n > 1 ? `?page=${n}` : "") },
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return <CategoryPage slug="culture" page={page} />;
}
