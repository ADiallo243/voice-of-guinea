import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("migration applies; RLS isolates readers and authors; quota is atomic and global budget enforced", async () => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    create function public.is_newsroom_manager() returns boolean language sql as $$ select coalesce(current_setting('test.manager',true),'false')='true' $$;
    create table public.articles(id uuid primary key); create table public.profiles(id uuid primary key);
    grant usage on schema public, auth to anon, authenticated, service_role;
    insert into articles values('11111111-1111-4111-8111-111111111111');
    insert into profiles values('22222222-2222-4222-8222-222222222222');`);
  await db.exec(
    await readFile(
      "supabase/migrations/20261115010644_naya_reading_assistant.sql",
      "utf8",
    ),
  );
  await db.exec(
    `insert into naya_summaries(article_id,content_hash,status,model,draft) values('11111111-1111-4111-8111-111111111111',repeat('a',64),'draft','test','["a","b","c"]');`,
  );
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    if (role === "anon")
      await assert.rejects(
        () => db.query("select * from naya_summaries"),
        /permission denied/,
      );
    else {
      assert.equal(
        (await db.query("select * from naya_summaries")).rows.length,
        0,
      );
      assert.equal(
        (
          await db.query(
            "update naya_summaries set status='rejected' returning *",
          )
        ).rows.length,
        0,
      );
    }
    await assert.rejects(
      () => db.query("select consume_naya_quota(repeat('b',64),5,10)"),
      /permission denied/,
    );
    await db.exec("reset role");
  }
  await db.exec(
    `set role authenticated; set test.manager='true'; set test.uid='22222222-2222-4222-8222-222222222222';`,
  );
  assert.equal((await db.query("select * from naya_summaries")).rows.length, 1);
  await db.exec(
    `update naya_summaries set status='approved',approved='["a","b","c"]',approved_at=now(),reviewer_id=auth.uid(); reset role;`,
  );
  await db.exec("set role service_role");
  const quota = await Promise.all(
    Array.from({ length: 10 }, () =>
      db.query<{ allowed: boolean }>(
        "select consume_naya_quota(repeat('b',64),5,6) as allowed",
      ),
    ),
  );
  assert.equal(quota.filter((r) => r.rows[0].allowed).length, 5);
  assert.equal(
    (
      await db.query<{ allowed: boolean }>(
        "select consume_naya_quota(repeat('c',64),5,6) as allowed",
      )
    ).rows[0].allowed,
    true,
  );
  assert.equal(
    (
      await db.query<{ allowed: boolean }>(
        "select consume_naya_quota(repeat('d',64),5,6) as allowed",
      )
    ).rows[0].allowed,
    false,
  );
  await db.close();
});
