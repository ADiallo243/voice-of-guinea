import { Naya } from "../../../src/components/naya";
import { NewsletterPopup } from "../../../src/components/newsletter-popup";
export default function Page() {
  return (
    <main className="shell">
      <h1>Article de test</h1>
      <Naya
        slug="article-test"
        chat
        points={[
          "Trois partenariats ont été annoncés.",
          "Leur traduction en marchés reste à vérifier.",
          "Les PME participent au forum.",
        ]}
      />
      <div style={{ height: 1800 }}>
        Contenu de test pour vérifier le défilement.
      </div>
      <NewsletterPopup />
    </main>
  );
}
