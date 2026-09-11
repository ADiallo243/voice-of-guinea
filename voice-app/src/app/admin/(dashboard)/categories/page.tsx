import { ConfirmSubmit } from "@/components/confirm-submit";
import { redirect } from "next/navigation";
import { getNewsroomUser } from "@/lib/supabase/admin";
import { deleteCategory, saveCategory } from "../actions";

export default async function AdminCategoriesPage() {
  const newsroom = await getNewsroomUser();
  if (!newsroom?.profile?.role || !["owner", "editor"].includes(newsroom.profile.role)) redirect("/admin");
  const { data: categories } = await newsroom!.supabase
    .from("categories")
    .select("id, name, slug, description, display_order, active, articles(count)")
    .order("display_order");
  const isOwner = newsroom?.profile?.role === "owner";

  return (
    <>
      <header className="admin-header">
        <div><span className="admin-kicker">Organisation</span><h1>Catégories</h1><p>Ajoutez, modifiez et organisez les rubriques visibles sur le site.</p></div>
      </header>
      <div className="category-admin-grid">
        <section className="admin-panel category-list">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Rubriques</span><h2>Catégories existantes</h2></div></div>
          {(categories ?? []).map((category) => (
            <details key={category.id} className="category-editor">
              <summary><div><strong>{category.name}</strong><span>/{category.slug} · {category.articles?.[0]?.count ?? 0} article(s)</span></div><span className={`status ${category.active ? "active" : "archived"}`}>{category.active ? "Active" : "Masquée"}</span></summary>
              <form action={saveCategory} className="category-form">
                <input type="hidden" name="id" value={category.id} />
                <label>Nom<input name="name" defaultValue={category.name} required /></label>
                <label>Adresse<input name="slug" defaultValue={category.slug} required /></label>
                <label>Description<textarea name="description" rows={2} defaultValue={category.description ?? ""} /></label>
                <label>Ordre<input name="displayOrder" type="number" defaultValue={category.display_order} /></label>
                <label className="check-row"><input name="active" type="checkbox" defaultChecked={category.active} /> Visible sur le site</label>
                <button className="admin-primary" type="submit">Enregistrer</button>
              </form>
              {isOwner && <ConfirmSubmit action={deleteCategory} message={`Supprimer la catégorie « ${category.name} » ? Les articles resteront disponibles sans catégorie.`} className="danger-link" field={{ name: "id", value: category.id }}>Supprimer</ConfirmSubmit>}
            </details>
          ))}
        </section>
        <section className="admin-panel new-category">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Nouvelle rubrique</span><h2>Ajouter</h2></div></div>
          <form action={saveCategory} className="category-form">
            <label>Nom<input name="name" required placeholder="Ex. Sport" /></label>
            <label>Adresse<input name="slug" placeholder="Créée automatiquement" /></label>
            <label>Description<textarea name="description" rows={3} /></label>
            <label>Ordre<input name="displayOrder" type="number" defaultValue={4} /></label>
            <label className="check-row"><input name="active" type="checkbox" defaultChecked /> Visible sur le site</label>
            <button className="admin-primary" type="submit">Ajouter la catégorie</button>
          </form>
        </section>
      </div>
    </>
  );
}
