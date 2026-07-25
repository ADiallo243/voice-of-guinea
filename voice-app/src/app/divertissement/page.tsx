import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = {
  title: "Divertissement en Guinée",
  description: "Musique, cinéma, tendances et talents à suivre sur la scène guinéenne.",
  alternates: { canonical: "/divertissement" },
};

export default function DivertissementPage() {
  return <CategoryPage category="Divertissement" intro="Musique, cinéma, tendances et talents à suivre sur la scène guinéenne." />;
}
