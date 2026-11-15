"use client";
import { useState } from "react";
import { saveArticleFeedback } from "@/app/admin/(dashboard)/actions";
export function EditorSaveForm({ children }: { children: React.ReactNode }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="article-editor"
      aria-busy={busy}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
          const result = await saveArticleFeedback(data);
          if (result?.error) setError(result.error);
        } catch {
          setError(
            "Enregistrement interrompu. Votre texte est conservé dans le formulaire. Réessayez après vérification.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && (
        <p
          className="admin-flash"
          role="alert"
          style={{ gridColumn: "1 / -1" }}
        >
          {error}
        </p>
      )}
      {busy && <p role="status">Enregistrement en cours…</p>}
      {children}
    </form>
  );
}
