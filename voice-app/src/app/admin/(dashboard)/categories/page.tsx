export default function AdminCategoriesPage() {
  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Organisation</span><h1>Catégories</h1><p>Structurez les rubriques visibles sur le site.</p></div>
        <button className="admin-primary">+ Ajouter</button>
      </header>
      <section className="admin-stats category-stats">
        {["Actualités", "Culture", "Divertissement"].map((category, index) => (
          <article key={category}>
            <span>Rubrique 0{index + 1}</span>
            <strong className="category-name">{category}</strong>
            <small>Active sur le site</small>
          </article>
        ))}
      </section>
    </>
  );
}
