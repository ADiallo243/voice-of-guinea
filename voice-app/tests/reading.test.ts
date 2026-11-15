import { test } from "node:test";
import assert from "node:assert/strict";
import { articles } from "../src/lib/articles";
import { editorialPoints, readingContent, readingParagraphs, relatedArticles, formatArticles } from "../src/lib/reading";
const mining = { ...articles[0], slug: "mining", title: "FONASEM : les PME minières", summary: "Les entreprises guinéennes au sommet Simandou.", publishedAt: "2026-11-14T12:00:00Z" };
const football = { ...mining, slug: "football", title: "CAN 2027 : la Guinée bat l’Érythrée", summary: "Le Syli joue à Conakry." };
const secondMining = { ...mining, slug: "bauxite", title: "Bauxite : le secteur minier", summary: "Un projet minier à suivre." };
test("related reading matches subject instead of broad category and excludes the current story", () => {
  assert.deepEqual(relatedArticles(mining, [football, mining, secondMining]).map(a => a.slug), ["bauxite"]);
  assert.deepEqual(relatedArticles(mining, [football]), []);
});
test("editorial points round trip without duplicate content and reject incomplete or oversized summaries", () => {
  const body = [{ type: "paragraph", text: "Texte original." }];
  const saved = [...editorialPoints(["Un fait.", "Une attribution.", "Une réserve."]), ...body];
  assert.deepEqual(readingContent(saved), { points: ["Un fait.", "Une attribution.", "Une réserve."], blocks: body });
  assert.deepEqual(readingContent(body), { points: [], blocks: body });
  assert.deepEqual(editorialPoints(["", "", ""]), []);
  assert.throws(() => editorialPoints(["Un fait.", "", "Une réserve."]));
  assert.throws(() => editorialPoints(["a".repeat(281), "b", "c"]));
});
test("paragraph splitting preserves words and punctuation and keeps source URLs intact", () => {
  const text = ["Une phrase complète avec des détails utiles.".repeat(8), "Une autre phrase qui garde son attribution.".repeat(8)].join(" ");
  assert.equal(readingParagraphs(text).join(" "), text);
  assert.ok(readingParagraphs(text).length > 1);
  const source = "Une source " + "a".repeat(450) + " https://example.com/source. Une autre.";
  assert.deepEqual(readingParagraphs(source), [source]);
});
test("weekly collection uses real publication dates, excludes future content and does not relabel old stories", () => {
  const old = { ...mining, slug: "old", publishedAt: "2026-10-01T12:00:00Z" };
  const future = { ...mining, slug: "future", publishedAt: "2026-12-01T12:00:00Z" };
  assert.deepEqual(formatArticles("la-semaine-en-guinee", [old, future, mining], new Date("2026-11-15T12:00:00Z")).map(a => a.slug), ["mining"]);
  assert.deepEqual(formatArticles("unknown", [mining]), []);
  assert.deepEqual(formatArticles("ce-qui-change-pour-vous", [football, mining], new Date("2026-11-15T12:00:00Z")).map(a => a.slug), ["mining"]);
});
