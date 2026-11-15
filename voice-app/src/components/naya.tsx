"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { track } from "@/lib/engagement";
const Chat = dynamic(() => import("./naya-chat"), {
  loading: () => <p role="status">Chargement de Naya…</p>,
});
export function Naya({
  slug,
  points,
  chat,
}: {
  slug: string;
  points: string[] | null;
  chat: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="naya"
      data-naya-open={open}
      aria-label="Naya, l’assistante IA de Voice of Guinea"
    >
      <button
        className="naya-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="naya-content"
        onClick={() => {
          if (!open) {
            track("naya_opened");
            if (points) track("naya_summary_viewed");
          }
          setOpen(!open);
        }}
      >
        <span>✦ Naya · Comprendre cet article</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div id="naya-content" className="naya-content" hidden={!open}>
        {open && (
          <>
            {points && (
              <>
                <h2>L’essentiel en 3 points</h2>
                <ul>
                  {points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <small>Résumé assisté par IA, vérifié par la rédaction.</small>
              </>
            )}
            {chat && <Chat slug={slug} />}
            <small>
              Naya est une intelligence artificielle et peut commettre des
              erreurs. Vérifiez les informations importantes.
            </small>
          </>
        )}
      </div>
    </section>
  );
}
