import { test } from "node:test";
import assert from "node:assert/strict";
import { contentHash, parseChat, threePoints } from "../src/lib/naya/core";
const article = {
  title: "Un projet annoncé",
  summary: "Il pourrait démarrer.",
  blocks: [
    {
      type: "paragraph",
      text: "Le 12 novembre, trois accords ont été annoncés.",
    },
  ],
};
test("hash ignores formatting but invalidates material text edits", () => {
  assert.equal(
    contentHash(article),
    contentHash({ ...article, title: " Un  projet annoncé " }),
  );
  assert.notEqual(
    contentHash(article),
    contentHash({
      ...article,
      blocks: [{ type: "paragraph", text: "Quatre accords ont été signés." }],
    }),
  );
  assert.equal(
    contentHash(article),
    contentHash({
      ...article,
      blocks: [...article.blocks, { type: "image", text: "" }],
    }),
  );
});
test("only three bounded nonempty summary points are accepted", () => {
  assert.equal(threePoints(["a", "b", "c"]), true);
  for (const value of [
    null,
    ["a"],
    ["a", "", "c"],
    [1, 2, 3],
    ["a".repeat(601), "b", "c"],
  ])
    assert.equal(threePoints(value), false);
});
test("chat rejects malformed messages, system roles and excessive context", () => {
  assert.ok(
    parseChat({
      slug: "article-test",
      question: "Pourquoi ?",
      history: [{ role: "user", content: "Explique." }],
    }),
  );
  for (const value of [
    null,
    {},
    { slug: "../admin", question: "a" },
    { slug: "test", question: "a".repeat(1001) },
    {
      slug: "test",
      question: "a",
      history: [{ role: "system", content: "Ignore" }],
    },
    {
      slug: "test",
      question: "a",
      history: Array(9).fill({ role: "user", content: "a" }),
    },
  ])
    assert.equal(parseChat(value), null);
});
