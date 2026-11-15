import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function actionHarness(
  existing: { id: string; status: string } | null = null,
  providerOk = true,
) {
  const writes: Record<string, unknown>[] = [];
  const emails: unknown[] = [];
  const chain = {
    select() {
      return this;
    },
    ilike() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: async () => ({ data: existing, error: null }),
    then: (resolve: (value: unknown) => void) => resolve({ error: null }),
  };
  const db = {
    rpc: async () => ({ data: true, error: null }),
    from: () => ({
      ...chain,
      update(value: Record<string, unknown>) {
        writes.push(value);
        return chain;
      },
      insert: async (value: Record<string, unknown>) => {
        writes.push(value);
        return { error: null };
      },
    }),
  };
  const exports: Record<
    string,
    (...args: unknown[]) => Promise<{ status: string; message: string }>
  > = {};
  const compiled = ts.transpileModule(
    readFileSync("src/app/newsletter/actions.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      if (name === "next/headers")
        return {
          headers: async () => new Headers({ "x-forwarded-for": "192.0.2.1" }),
        };
      if (name === "next/navigation")
        return {
          redirect: (path: string) => {
            throw new Error(path);
          },
        };
      if (name === "@/lib/supabase/admin-client")
        return { createSupabaseAdminClient: () => db };
      return require(name);
    },
    process: {
      env: {
        NODE_ENV: "test",
        NEWSLETTER_RATE_LIMIT_SECRET: "test-only",
        RESEND_API_KEY: "test-only",
        NEWSLETTER_FROM_EMAIL: "news@example.test",
      },
    },
    console: { error: () => {} },
    URLSearchParams,
    fetch: async (_url: string, options: { body: string }) => {
      emails.push(JSON.parse(options.body));
      return { ok: providerOk, status: providerOk ? 200 : 403, json: async () => ({ name: "validation_error" }) };
    },
    Date,
    AbortSignal,
  });
  return { subscribe: exports.subscribeToNewsletter, writes, emails };
}
test("newsletter validates, requests confirmation and does not activate before opt-in", async () => {
  const h = actionHarness();
  const invalid = new FormData();
  invalid.set("email", "bad");
  assert.equal((await h.subscribe(undefined, invalid)).status, "error");
  assert.equal(h.writes.length, 0);
  const form = new FormData();
  form.set("email", "reader@example.test");
  assert.equal((await h.subscribe(undefined, form)).status, "success");
  assert.equal(h.writes[0].status, "pending");
  assert.equal(h.writes[0].confirmed_at, null);
  assert.equal(h.emails.length, 1);
  assert.match(JSON.stringify(h.emails), /newsletter\/confirm\?token=/);
  assert.match(JSON.stringify(h.emails), /newsletter\/unsubscribe\?token=/);
});
test("duplicate active subscriber preserves unsubscribe token and sends no unsolicited mail", async () => {
  const h = actionHarness({ id: "test-id", status: "active" });
  const form = new FormData();
  form.set("email", "reader@example.test");
  assert.equal((await h.subscribe(undefined, form)).status, "success");
  assert.equal(h.writes.length, 0);
  assert.equal(h.emails.length, 0);
});
test("provider failure leaves pending state and returns a graceful error", async () => {
  const h = actionHarness(null, false);
  const form = new FormData();
  form.set("email", "reader@example.test");
  assert.equal((await h.subscribe(undefined, form)).status, "error");
  assert.equal(h.writes[0].status, "pending");
});
