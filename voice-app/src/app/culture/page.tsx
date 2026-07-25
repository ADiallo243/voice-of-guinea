import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = {
  title: "Culture guinéenne",
  description: "Découvrez la culture, le patrimoine, les artistes et les idées qui font vivre la Guinée.",
  alternates: { canonical: "/culture" },
};

export default function CulturePage() {
  return <CategoryPage category="Culture" intro="Création, patrimoine, idées et expressions qui racontent la richesse de la Guinée." />;
}
