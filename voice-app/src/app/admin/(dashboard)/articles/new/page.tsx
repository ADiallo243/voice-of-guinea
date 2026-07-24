export default function NewArticlePage() {
  return (
    <>
      <header className="admin-header editor-header">
        <div><span className="admin-kicker">Nouvelle publication</span><h1>Créer un article</h1><p>Enregistrez un brouillon ou préparez sa publication.</p></div>
        <div className="editor-actions"><button className="admin-secondary">Enregistrer le brouillon</button><button className="admin-primary">Publier</button></div>
      </header>
      <form className="article-editor">
        <section className="editor-main">
          <label className="editor-title">Titre de l’article<input name="title" placeholder="Écrivez un titre clair et précis…" /></label>
          <label>Résumé<textarea name="excerpt" rows={3} placeholder="Le résumé visible sur les cartes et dans les résultats de recherche…" /></label>
          <label>Contenu<textarea name="content" rows={16} placeholder="Commencez à écrire votre article…" /></label>
        </section>
        <aside className="editor-sidebar">
          <div className="editor-box"><h2>Publication</h2><label>Statut<select name="status"><option>Brouillon</option><option>Publier maintenant</option><option>Programmer</option></select></label><label className="check-row"><input type="checkbox" name="featured" /> Mettre à la une</label><label className="check-row"><input type="checkbox" name="breaking" /> Ajouter à Dernière minute</label></div>
          <div className="editor-box"><h2>Classement</h2><label>Catégorie<select name="category"><option>Actualités</option><option>Culture</option><option>Divertissement</option></select></label></div>
          <div className="editor-box"><h2>Image principale</h2><label className="upload-zone"><input type="file" accept="image/jpeg,image/png,image/webp" /><strong>Choisir une image</strong><span>JPG, PNG ou WebP · 10 Mo max.</span></label></div>
        </aside>
      </form>
    </>
  );
}
