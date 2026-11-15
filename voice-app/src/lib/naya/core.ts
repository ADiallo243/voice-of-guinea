import { createHash } from "node:crypto";

export type ReadingSource = {
  title: string;
  summary: string;
  blocks: { type: string; text?: string }[];
};
export function sourceText(article: ReadingSource) {
  return [
    article.title,
    article.summary,
    ...article.blocks
      .filter((b) => b && b.type !== "image" && typeof b.text === "string" && b.text.trim())
      .map((b) => b.text || ""),
  ]
    .map((s) => s.normalize("NFC").replace(/\s+/g, " ").trim())
    .join("\n");
}
export function contentHash(article: ReadingSource) {
  return createHash("sha256").update(sourceText(article)).digest("hex");
}
export function threePoints(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (v) => typeof v === "string" && v.trim().length > 0 && v.length <= 600,
    )
  );
}
export type ChatMessage = { role: "user" | "assistant"; content: string };
export function parseChat(
  value: unknown,
): { slug: string; question: string; history: ChatMessage[] } | null {
  if (!value || typeof value !== "object") return null;
  const { slug, question, history = [] } = value as Record<string, unknown>;
  if (
    typeof slug !== "string" ||
    !/^[a-z0-9-]{1,180}$/.test(slug) ||
    typeof question !== "string" ||
    !question.trim() ||
    question.length > 1000 ||
    !Array.isArray(history) ||
    history.length > 8
  )
    return null;
  if (
    !history.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length <= 2500,
    )
  )
    return null;
  return { slug, question: question.trim(), history };
}
