import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  editorText,
  parseEditorText,
  localSchedule,
  parseSchedule,
  publicationTime,
  relationOne,
} from "../src/lib/newsroom";
import type { ContentBlock } from "../src/lib/articles";
test("Toronto scheduling survives DST and rejects ambiguous or nonexistent hours", () => {
  assert.equal(localSchedule("2026-11-18T06:00:00Z"), "2026-11-18T01:00");
  assert.equal(
    parseSchedule("2026-11-18T01:00").toISOString(),
    "2026-11-18T06:00:00.000Z",
  );
  assert.equal(
    parseSchedule("2026-07-15T01:00").toISOString(),
    "2026-07-15T05:00:00.000Z",
  );
  assert.throws(() => parseSchedule("2026-03-08T02:30"));
  assert.throws(() => parseSchedule("2026-11-01T01:30"));
});
test("normal editing preserves publication time and embedded media, and relations support both shapes", () => {
  const original = "2026-11-15T18:27:47.281919Z";
  assert.equal(publicationTime(original, "", false), original);
  assert.throws(() =>
    publicationTime(original, "2028-11-15T13:00", true, new Date("2026-11-15")),
  );
  const blocks: ContentBlock[] = [
    { type: "paragraph", text: "A" },
    { type: "image", src: "/images/a.jpg", alt: "A", credit: "Owner" },
    { type: "heading", text: "B" },
  ];
  assert.deepEqual(parseEditorText(editorText(blocks), blocks), blocks);
  assert.throws(() => parseEditorText("A", blocks));
  assert.equal(relationOne({ name: "Diaspora" })?.name, "Diaspora");
  assert.equal(relationOne([{ name: "Diaspora" }])?.name, "Diaspora");
});
test("live-shaped migration closes notes, rejects stale saves, preserves feature atomicity and enforces MFA/active roles", async () => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql as $$select coalesce(nullif(current_setting('test.jwt',true),''),'{}')::jsonb$$;
 create table auth.mfa_factors(user_id uuid,status text);
 create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
 create table profiles(id uuid primary key,full_name text,active boolean,role text);
 create table categories(id uuid primary key,name text,slug text,active boolean);alter table categories enable row level security;
 create table articles(id uuid primary key default gen_random_uuid(),title text,slug text unique,excerpt text,content jsonb,hero_image_url text,hero_image_alt text,image_credit text,category_id uuid,author_id uuid,status text,featured boolean,published_at timestamptz,scheduled_for timestamptz,created_at timestamptz,updated_at timestamptz,seo_title text,seo_description text,correction_note text,source_notes text,editorial_notes text,reviewed_at timestamptz,reviewed_by uuid,byline text,last_edited_at timestamptz);
 alter table articles enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 grant select on articles to anon,authenticated;grant insert,update,delete on articles to authenticated;
 create policy readable on articles for select to anon,authenticated using(status='published' or author_id=auth.uid());
 create function is_newsroom_staff() returns boolean language sql as $$select false$$;
 create function is_newsroom_manager() returns boolean language sql as $$select false$$;
 create function is_newsroom_owner() returns boolean language sql as $$select false$$;
 create function capture_article_revision() returns trigger language plpgsql as $$begin return new;end$$;
 create function log_newsroom_change() returns trigger language plpgsql as $$begin return new;end$$;
 create function handle_new_user() returns trigger language plpgsql as $$begin return new;end$$;
 insert into profiles values('11111111-1111-4111-8111-111111111111','Owner',true,'owner');
 insert into articles(id,title,slug,content,status,featured,published_at,created_at,updated_at,author_id,source_notes,editorial_notes) values('22222222-2222-4222-8222-222222222222','Original','original','[]','published',true,'2026-11-15 18:27Z',now(),'2026-11-15 18:27Z','11111111-1111-4111-8111-111111111111','Private source','Private notes');`);
  await db.exec(
    await readFile(
      "supabase/migrations/20261115192712_newsroom_integrity_repair.sql",
      "utf8",
    ),
  );
  await db.exec("set role anon");
  assert.equal((await db.query("select slug from articles")).rows.length, 1);
  await assert.rejects(
    () => db.query("select editorial_notes from articles"),
    /permission denied/,
  );
  await assert.rejects(
    () => db.query("select source_notes from articles"),
    /permission denied/,
  );
  await assert.rejects(
    () =>
      db.query(
        "select get_newsroom_article('22222222-2222-4222-8222-222222222222')",
      ),
    /permission denied/,
  );
  await db.exec(
    "reset role;set role authenticated;set test.uid='33333333-3333-4333-8333-333333333333'",
  );
  await assert.rejects(
    () =>
      db.query(
        "select get_newsroom_article('22222222-2222-4222-8222-222222222222')",
      ),
    /access required/,
  );
  await db.exec("set test.uid='11111111-1111-4111-8111-111111111111'");
  const note = await db.query<{ v: { editorial_notes: string } }>(
    "select get_newsroom_article('22222222-2222-4222-8222-222222222222') v",
  );
  assert.equal(note.rows[0].v.editorial_notes, "Private notes");
  const id = "22222222-2222-4222-8222-222222222222";
  await assert.rejects(
    () =>
      db.query("select save_newsroom_article($1,$2,$3)", [
        JSON.stringify({ title: "Lost change", status: "draft" }),
        id,
        "2026-11-15 18:00Z",
      ]),
    /changé/,
  );
  assert.equal(
    (await db.query<{ title: string }>("select title from articles")).rows[0]
      .title,
    "Original",
  );
  await assert.rejects(
    () =>
      db.query("select save_newsroom_article($1,$2,$3)", [
        JSON.stringify({ status: "published", sources_approved: false }),
        id,
        "2026-11-15 18:27Z",
      ]),
    /sources/,
  );
  const publishPayload = {
    title: "Second",
    slug: "second",
    excerpt: "Verified",
    content: [
      { type: "paragraph", text: "A sourced fact" },
      { type: "heading", text: "Sources" },
      { type: "paragraph", text: "Official: https://example.org" },
    ],
    status: "published",
    featured: true,
    hero_image_url: "/brand/logo.svg",
    hero_image_alt: "Logo",
    image_credit: "Voice of Guinea",
    published_at: new Date(Date.now() - 86400000).toISOString(),
    sources_approved: true,
    rights_approved: true,
  };
  const second = await db.query<{ v: string }>(
    "select save_newsroom_article($1,null,null) v",
    [JSON.stringify(publishPayload)],
  );
  assert.equal(
    (
      await db.query<{ featured: boolean }>(
        "select featured from articles where id=$1",
        [id],
      )
    ).rows[0].featured,
    false,
  );
  await assert.rejects(
    () =>
      db.query("select save_newsroom_article($1,null,null)", [
        JSON.stringify({ ...publishPayload, slug: "original" }),
      ]),
    /duplicate/,
  );
  assert.equal(
    (
      await db.query<{ featured: boolean }>(
        "select featured from articles where id=$1",
        [second.rows[0].v],
      )
    ).rows[0].featured,
    true,
  );
  await db.query("select save_newsroom_article($1,$2,$3)", [
    JSON.stringify({
      title: "Reviewed draft",
      status: "draft",
      featured: false,
    }),
    id,
    "2026-11-15 18:27Z",
  ]);
  assert.equal(
    (
      await db.query<{ published_at: Date }>(
        "select published_at from articles where slug='original'",
      )
    ).rows[0].published_at.toISOString(),
    "2026-11-15T18:27:00.000Z",
  );
  await db.exec(
    "reset role;insert into auth.mfa_factors values('11111111-1111-4111-8111-111111111111','verified');set role authenticated;set test.jwt='{\"aal\":\"aal1\"}'",
  );
  await assert.rejects(
    () => db.query("select get_newsroom_article($1)", [id]),
    /access required/,
  );
  assert.equal(
    (
      await db.query<{ v: { role: string } }>(
        "select get_newsroom_identity() v",
      )
    ).rows[0].v.role,
    "owner",
  );
  await db.exec('set test.jwt=\'{"aal":"aal2"}\'');
  assert.ok(
    (await db.query("select get_newsroom_article($1)", [id])).rows.length,
  );
  await db.exec(
    "reset role;update profiles set active=false;set role authenticated",
  );
  await assert.rejects(
    () => db.query("select get_newsroom_article($1)", [id]),
    /access required/,
  );
  assert.equal(
    (await db.query("update articles set title='Unauthorized' returning id"))
      .rows.length,
    0,
  );
  await db.exec(
    "reset role;insert into articles(id,title,slug,status,featured,scheduled_for,content) values('44444444-4444-4444-8444-444444444444','Future','future','scheduled',false,'2099-01-01','[]');set role service_role",
  );
  assert.equal(
    (
      await db.query<{ v: boolean }>(
        "select publish_due_newsroom_article('44444444-4444-4444-8444-444444444444','2100-01-01') v",
      )
    ).rows[0].v,
    false,
  );
  await db.exec(
    "reset role;update articles set scheduled_for='2020-01-01' where slug='future';set role service_role",
  );
  assert.equal(
    (
      await db.query<{ v: boolean }>(
        "select publish_due_newsroom_article('44444444-4444-4444-8444-444444444444',now()) v",
      )
    ).rows[0].v,
    true,
  );
  assert.equal(
    (
      await db.query<{ v: boolean }>(
        "select publish_due_newsroom_article('44444444-4444-4444-8444-444444444444',now()) v",
      )
    ).rows[0].v,
    false,
  );
  await db.close();
});
