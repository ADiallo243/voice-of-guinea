import type { Article } from "./articles";

export const keyPointsHeading = "L’essentiel en 3 points";

// Store editorial takeaways in the existing versioned article content, not an AI service.
export function readingContent<T extends { type: string; text?: string }>(blocks: T[]) {
  if (blocks[0]?.type === "heading" && blocks[0].text === keyPointsHeading &&
      blocks.slice(1, 4).length === 3 && blocks.slice(1, 4).every(b => b.type === "paragraph" && b.text?.trim())) {
    return { points: blocks.slice(1, 4).map(b => b.text!), blocks: blocks.slice(4) };
  }
  return { points: [] as string[], blocks };
}

export function editorialPoints(values: string[]) {
  const points = values.map(s => s.trim());
  if (points.every(s => !s)) return [];
  if (points.length !== 3 || points.some(s => !s || s.length > 280 || /[\r\n]/.test(s)))
    throw new Error("Ajoutez trois points complets, de 280 caractères maximum chacun, ou laissez les trois champs vides.");
  return [{ type: "heading", text: keyPointsHeading }, ...points.map(text => ({ type: "paragraph", text }))];
}

export function readingParagraphs(text: string) {
  if (text.length <= 420 || /https?:\/\//.test(text)) return [text];
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/u);
  const paragraphs: string[] = [];
  for (const sentence of sentences) {
    const last = paragraphs.length - 1;
    if (last < 0 || paragraphs[last].length + sentence.length > 420) paragraphs.push(sentence);
    else paragraphs[last] += ` ${sentence}`;
  }
  return paragraphs;
}

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const topicRules: [string, RegExp][] = [
  ["mines", /\b(minier\w*|mines|mining|bauxite|simandou|fonasem)\b/],
  ["football", /\b(football|feguifoot|syli|can 20\d\d|feminin u17|erythree|mondial)\b/],
  ["electricite", /\b(electricite|edg|delestage\w*|coupures|hydroelectrique)\b/],
  ["environnement", /\b(chimpanze\w*|parcs?|wcf|ecosysteme\w*|conservation|pinselli|bafing)\b/],
  ["livres", /\b(livre\w*|litterature|siljc|ganndal|lecture)\b/],
  ["arts", /\b(musee|exposition|soie|artiste|foulards?|routchkina)\b/],
  ["talents", /\b(talents?|humoriste|mma|championne|sonfonia|musique|chanteur|chanteuse)\b/],
  ["agriculture", /\b(agric\w*|fida|agrifarm|paysan\w*)\b/],
  ["sante-travail", /\b(maladies?|indemnis\w*|sante|travailleurs?)\b/],
  ["assainissement", /\b(sanita|assainissement|dechets|tractopelle\w*)\b/],
  ["medias", /\b(rtg|boulbinet|medias|journalistes?|presse|uplg)\b/],
  ["numerique", /\b(facebook|vpn|internet|numerique|reseaux sociaux)\b/],
];
export function articleTopics(article: Pick<Article, "title" | "summary">) {
  const text = normalize(`${article.title} ${article.summary}`);
  return topicRules.filter(([, rule]) => rule.test(text)).map(([topic]) => topic);
}

// A shared broad category is not enough to call two stories related.
export function relatedArticles<T extends Article>(article: T, candidates: T[], limit = 3) {
  const topics = new Set(articleTopics(article));
  return candidates.filter(a => a.slug !== article.slug)
    .map(a => ({ article: a, score: articleTopics(a).filter(t => topics.has(t)).length }))
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(b.article.publishedAt) - Date.parse(a.article.publishedAt))
    .slice(0, limit).map(a => a.article);
}

export const readingFormats = [
  { slug: "la-semaine-en-guinee", title: "La semaine en Guinée", label: "Le point de la semaine", description: "Les articles publiés ces sept derniers jours, réunis pour rattraper l’essentiel." },
  { slug: "talents-a-decouvrir", title: "Le talent à découvrir", label: "Des parcours à suivre", description: "Sport, création, humour : les talents guinéens racontés à travers leurs réalisations." },
  { slug: "ce-qui-change-pour-vous", title: "Ce qui change pour vous", label: "Des repères concrets", description: "Électricité, travail, agriculture, environnement : comprendre les annonces et ce qui reste à vérifier." },
] as const;

export function formatArticles<T extends Article>(slug: string, articles: T[], now = new Date()) {
  const published = articles.filter(a => Date.parse(a.publishedAt) <= now.getTime())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  if (slug === "la-semaine-en-guinee") return published.filter(a => Date.parse(a.publishedAt) >= now.getTime() - 7 * 86400000);
  if (slug === "talents-a-decouvrir") return published.filter(a => a.category === "Divertissement" || articleTopics(a).includes("talents"));
  if (slug === "ce-qui-change-pour-vous") return published.filter(a => articleTopics(a).some(t => ["mines", "electricite", "environnement", "agriculture", "sante-travail", "assainissement", "numerique"].includes(t)));
  return [];
}
