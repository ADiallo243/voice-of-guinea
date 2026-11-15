"use client";
import { useState } from "react";
export function EditorImageMode({
  textFirst = false,
}: {
  textFirst?: boolean;
}) {
  const [enabled, setEnabled] = useState(textFirst);
  return (
    <label className="check-row">
      <input
        type="checkbox"
        name="textFirst"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />
      Présentation sans photographie (aucune image documentaire disponible)
    </label>
  );
}
