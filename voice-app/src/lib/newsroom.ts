import type { ContentBlock } from "./articles";
export const newsroomTimeZone = "America/Toronto";
export function relationOne<T>(
  value: T | T[] | null | undefined,
): T | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}
export function localSchedule(value?: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: newsroomTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map((v) => [v.type, v.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// Convert the named timezone explicitly, never using the server/browser timezone.
export function parseSchedule(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Date de programmation invalide.");
  const target = Date.parse(value + ":00Z");
  if (!Number.isFinite(target)) throw new Error("Date invalide.");
  const matches = [-5, -4]
    .map((offset) => new Date(target - offset * 3600000))
    .filter((date) => localSchedule(date.toISOString()) === value);
  if (matches.length !== 1)
    throw new Error(
      "Cette heure est inexistante ou ambiguë au changement d’heure. Choisissez une autre heure.",
    );
  return matches[0];
}
export function newsroomDate(value: string) {
  return (
    new Intl.DateTimeFormat("fr-CA", {
      timeZone: newsroomTimeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value)) + " (Toronto)"
  );
}
export function publicationTime(
  previous: string | null | undefined,
  requested: string,
  change: boolean,
  now = new Date(),
) {
  if (!change) return previous || now.toISOString();
  if (!requested)
    throw new Error("Précisez la date de publication à corriger.");
  const date = parseSchedule(requested);
  if (date > now)
    throw new Error("Utilisez la programmation pour une date future.");
  return date.toISOString();
}
export function editorText(blocks: ContentBlock[]) {
  return blocks
    .map((b, i) =>
      b.type === "heading"
        ? `## ${b.text}`
        : b.type === "paragraph"
          ? b.text
          : `[[image:${i}]]`,
    )
    .join("\n\n");
}
export function parseEditorText(
  text: string,
  original: ContentBlock[] = [],
): ContentBlock[] {
  const used = new Set<number>();
  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean)
    .map((part): ContentBlock => {
      const token = part.match(/^\[\[image:(\d+)\]\]$/);
      if (token) {
        const i = Number(token[1]);
        if (original[i]?.type !== "image" || used.has(i))
          throw new Error("Référence d’image intégrée invalide.");
        used.add(i);
        return original[i];
      }
      return part.startsWith("## ")
        ? { type: "heading", text: part.slice(3) }
        : { type: "paragraph", text: part };
    });
  original.forEach((b, i) => {
    if (b.type === "image" && !used.has(i))
      throw new Error(
        "Un bloc image intégré manque. Conservez son repère pour éviter une suppression accidentelle.",
      );
  });
  return blocks;
}
export function approvedSourceUrls(blocks: ContentBlock[]) {
  const heading = blocks.findIndex(
    (b) => b.type === "heading" && /^sources?$/i.test(b.text.trim()),
  );
  if (heading < 0) return [];
  return [
    ...new Set(
      blocks
        .slice(heading + 1)
        .flatMap((b) =>
          b.type === "paragraph" &&
          !/^(photo|crédit|source de l.image)/i.test(b.text)
            ? b.text.match(/https?:\/\/[^\s]+/g) || []
            : [],
        ),
    ),
  ];
}
export function categoryPath(slug: string) {
  return ["actualites", "culture", "divertissement"].includes(slug)
    ? `/${slug}`
    : `/categories/${slug}`;
}
