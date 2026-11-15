"use client";
import { useState } from "react";
import { track } from "@/lib/engagement";
type Message = { role: "user" | "assistant"; content: string };
export default function NayaChat({ slug }: { slug: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState("");
  const [votes, setVotes] = useState<number[]>([]);
  async function ask(value: string) {
    if (pending || !value.trim()) return;
    setPending(true);
    setError("");
    setRetry(value);
    track("naya_question_submitted");
    try {
      const response = await fetch("/api/naya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          question: value,
          history: messages.slice(-8),
        }),
        signal: AbortSignal.timeout(25_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages((m) => [
        ...m,
        { role: "user", content: value },
        { role: "assistant", content: data.answer },
      ]);
      setQuestion("");
      track("naya_response_completed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réessaie dans un instant.");
      track("naya_response_error");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="naya-chat">
      <h3>Une question ? Demande à Naya.</h3>
      <div className="naya-conversation" aria-live="polite" aria-busy={pending}>
        {messages.map((m, i) => (
          <div className={`naya-message ${m.role}`} key={i}>
            <strong>{m.role === "user" ? "Vous" : "Naya"}</strong>
            <p>{m.content}</p>
            {m.role === "assistant" && (
              <>
                <a href={`/articles/${slug}`}>Source : cet article</a>
                <div aria-label="Évaluer la réponse">
                  {["Utile", "À améliorer"].map((v) => (
                    <button
                      type="button"
                      disabled={votes.includes(i)}
                      key={v}
                      onClick={() => {
                        setVotes((a) => [...a, i]);
                        track("naya_feedback_submitted", { rating: v });
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {!messages.length && (
        <div className="naya-suggestions">
          {[
            "Pourquoi c’est important ?",
            "Explique-moi simplement.",
            "Quelles sont les conséquences ?",
          ].map((q) => (
            <button
              type="button"
              disabled={pending}
              onClick={() => ask(q)}
              key={q}
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="naya-question">Votre question sur cet article</label>
        <div className="naya-input">
          <input
            id="naya-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={1000}
            required
            disabled={pending}
            autoComplete="off"
          />
          <button type="submit" disabled={pending || !question.trim()}>
            Envoyer
          </button>
        </div>
      </form>
      {pending && <p role="status">Naya prépare sa réponse…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => ask(retry)} disabled={pending}>
            Réessayer
          </button>
        </div>
      )}
      <small>
        N’indiquez pas de données personnelles. Votre question et le contexte
        sont transmis à Groq. <a href="/confidentialite">Confidentialité</a>.
      </small>
    </div>
  );
}
