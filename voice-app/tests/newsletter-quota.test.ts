import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('real newsletter and login throttles reproduce the old ambiguity and preserve limits after repair', async()=>{
 const db=new PGlite();
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role;');
 for(const [file,table,fn] of [['007_newsroom_hardening.sql','newsletter_signup_limits','consume_newsletter_signup_quota'],['012_publication_and_login_guards.sql','login_attempt_limits','consume_login_attempt_quota']]){
  const sql=await readFile('supabase/migrations/'+file,'utf8');await db.exec(sql.slice(sql.indexOf('create table if not exists public.'+table)));
  await assert.rejects(()=>db.query(`select public.${fn}(repeat('a',64))`),/ambiguous/);
 }
 await db.exec(await readFile('supabase/migrations/20261115013204_fix_newsletter_quota_ambiguity.sql','utf8'));
 for(const fn of ['consume_newsletter_signup_quota','consume_login_attempt_quota']){
  await db.exec('set role service_role');
  const results=await Promise.all(Array.from({length:6},()=>db.query<{allowed:boolean}>(`select public.${fn}(repeat('b',64)) as allowed`)));
  assert.equal(results.filter(r=>r.rows[0].allowed).length,5);
  await db.exec('reset role; set role anon');await assert.rejects(()=>db.query(`select public.${fn}(repeat('b',64))`),/permission denied/);await db.exec('reset role');
 }
 await db.close();
});
