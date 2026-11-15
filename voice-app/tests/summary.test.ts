import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as core from "../src/lib/naya/core";
const article = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Titre",
  summary: "Annonce",
  blocks: [{ type: "paragraph", text: "Trois projets annoncés." }],
};
function harness({
  approved = true,
  stale = false,
  disabled = false,
  unavailable = false,
  groqKey = "test-only",
} = {}) {
  let calls = 0;
  const chain = {
    select() {
      return this;
    },
    eq(key: string, value: unknown) {
      if (key === "content_hash") this.hash = String(value);
      return this;
    },
    hash: "",
    maybeSingle: async function () {
      if (unavailable) return { error: { message: "offline" }, data: null };
      return this.hash
        ? {
            data:
              approved &&
              this.hash === (stale ? "outdated" : core.contentHash(article))
                ? { approved: ["a", "b", "c"] }
                : null,
            error: null,
          }
        : { data: { disabled }, error: null };
    },
  };
  class FakeOpenAI {
    responses = {
      create: async () => {
        calls++;
        throw new Error("No live AI request expected");
      },
    };
  }
  const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  runInNewContext(
    ts.transpileModule(readFileSync("src/lib/naya/service.ts", "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      require: (name: string) =>
        name === "server-only"
          ? {}
          : name === "openai"
            ? { default: FakeOpenAI }
            : name === "./core"
              ? core
              : {
                  createSupabaseAdminClient: () => ({
                    from: () => ({ ...chain }),
                  }),
                },
      process: {
        env: {
          NAYA_SUMMARIES_ENABLED: "true",
          NAYA_CHAT_ENABLED: "true",
          GROQ_API_KEY: groqKey,
          OPENAI_API_KEY: "must-never-be-used",
          NAYA_RATE_LIMIT_SECRET: "test-only",
        },
      },
      Date,
    },
  );
  return { read: () => exports.publicNaya(article), calls: () => calls };
}
test("only approved summary of the current article version is projected; reads never generate", async () => {
  const h = harness();
  assert.deepEqual(JSON.parse(JSON.stringify(await h.read())), {
    points: ["a", "b", "c"],
    chat: true,
  });
  assert.equal(h.calls(), 0);
  for (const options of [{ approved: false }, { stale: true }]) {
    const h = harness(options);
    assert.deepEqual(JSON.parse(JSON.stringify(await h.read())), {
      points: null,
      chat: true,
    });
    assert.equal(h.calls(), 0);
  }
});
test("article-level opt-out and database failure hide Naya safely", async () => {
  assert.equal(await harness({ disabled: true }).read(), null);
  assert.equal(await harness({ unavailable: true }).read(), null);
});

test("an OpenAI key alone cannot activate chat or trigger a paid fallback", async () => {
  const h = harness({ groqKey: "" });
  assert.deepEqual(JSON.parse(JSON.stringify(await h.read())), {
    points: ["a", "b", "c"],
    chat: false,
  });
  assert.equal(h.calls(), 0);
});
