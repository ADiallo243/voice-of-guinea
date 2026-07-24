import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = { title: "Culture" };

export default function CulturePage() {
  return <CategoryPage category="Culture" intro="Création, patrimoine, idées et expressions qui racontent la richesse de la Guinée." />;
}
