export default function BreakingNewsAdminPage() {
  const headlines = [
    "Guinée : Facebook perturbé, recours aux VPN.",
    "Féguifoot en crise : une assemblée attendue.",
    "Projet minier : nouvel intérêt économique.",
    "Le Syli féminin U17 domine le Niger.",
  ];
  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Bandeau défilant</span><h1>Dernière minute</h1><p>Choisissez les nouvelles visibles en haut du site.</p></div>
        <button className="admin-primary">+ Ajouter</button>
      </header>
      <section className="admin-panel">
        <div className="admin-table">
          {headlines.map((headline, index) => (
            <div className="admin-table-row" key={headline}>
              <span className="drag-handle">⠿</span>
              <div><strong>{headline}</strong><span>Position {index + 1} · Sans expiration</span></div>
              <span className="status active">Actif</span>
              <button className="text-button">Modifier</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
