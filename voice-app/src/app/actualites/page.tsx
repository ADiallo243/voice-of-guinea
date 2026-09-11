import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = {
  title: "Actualités de Guinée",
  description: "Suivez les faits marquants économiques, sociaux, culturels et sportifs en Guinée, vérifiés et expliqués clairement.",
  alternates: { canonical: "/actualites" },
};

export default function ActualitesPage() {
  return <CategoryPage category="Actualités" intro="Les faits marquants en Guinée, expliqués clairement et remis dans leur contexte." />;
}
