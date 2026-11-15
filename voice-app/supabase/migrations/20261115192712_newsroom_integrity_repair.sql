-- Keep public reading available while making editorial notes staff-only.
alter table public.articles add column if not exists image_source_url text;
alter table public.articles add column if not exists image_rights_notes text;
alter table public.articles add column if not exists use_cms_image boolean not null default false;

create or replace function public.get_newsroom_article(article_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_newsroom_staff() then raise exception 'Newsroom access required'; end if;
  return (select to_jsonb(a) from public.articles a where a.id = article_id);
end;
$$;
revoke all on function public.get_newsroom_article(uuid) from public, anon;
grant execute on function public.get_newsroom_article(uuid) to authenticated;

create table public.article_redirects (
  old_slug text primary key,
  article_id uuid not null references public.articles(id) on delete cascade
);
alter table public.article_redirects enable row level security;
create policy "Redirect destinations are public metadata" on public.article_redirects for select to anon, authenticated using (true);
grant select on public.article_redirects to anon, authenticated;
create or replace function public.capture_article_redirect()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.article_redirects where old_slug=new.slug and article_id<>new.id) then raise exception 'This address is reserved by an existing redirect';end if;
  if tg_op='UPDATE' and old.slug is distinct from new.slug then
    if exists(select 1 from public.articles where slug=new.slug and id<>new.id)
      or exists(select 1 from public.article_redirects where old_slug=new.slug and article_id<>new.id) then
      raise exception 'This address belongs to another article';
    end if;
    delete from public.article_redirects where old_slug=new.slug and article_id=new.id;
    insert into public.article_redirects(old_slug,article_id) values(old.slug,new.id)
      on conflict(old_slug) do update set article_id=excluded.article_id;
  end if;
  return new;
end;
$$;
revoke all on function public.capture_article_redirect() from public,anon,authenticated;
create trigger capture_article_redirect before insert or update of slug on public.articles for each row execute function public.capture_article_redirect();

-- Serialize the save, feature selection, and version check as one transaction.
create or replace function public.save_newsroom_article(payload jsonb, article_id uuid default null, expected_updated_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare previous public.articles; saved public.articles; manager boolean; result_id uuid;
begin
  if not public.is_newsroom_staff() then raise exception 'Newsroom access required'; end if;
  manager := public.is_newsroom_manager();
  -- One lock order also prevents competing feature changes from deadlocking.
  perform pg_advisory_xact_lock(74138152);
  if article_id is not null then
    select * into previous from public.articles where id=article_id for update;
    if not found then raise exception 'Article not found'; end if;
    if expected_updated_at is null or previous.updated_at is distinct from expected_updated_at then
      raise exception 'Cet article a changé depuis son ouverture. Rechargez la page avant de réessayer.';
    end if;
    if not manager and (previous.author_id is distinct from auth.uid() or previous.status::text not in ('draft','in_review','needs_changes')) then
      raise exception 'Article editing is not permitted';
    end if;
  end if;
  saved := jsonb_populate_record(previous,payload);
  saved.id := coalesce(article_id,gen_random_uuid());
  saved.created_at := coalesce(previous.created_at,now());
  saved.updated_at := now();
  saved.author_id := coalesce(previous.author_id,auth.uid());
  saved.featured := manager and coalesce(saved.featured,false);
  saved.use_cms_image := coalesce(saved.use_cms_image,false);
  if saved.status is null then saved.status := 'draft'; end if;
  if not manager and saved.status::text not in ('draft','in_review') then raise exception 'Publication requires an editor'; end if;
  if not manager then saved.editorial_notes := previous.editorial_notes; end if;
  if saved.status::text in ('published','scheduled') then
    if not manager then raise exception 'Publication requires an editor'; end if;
    if coalesce((payload->>'sources_approved')::boolean,false) is not true
      or coalesce((payload->>'rights_approved')::boolean,false) is not true
      or not exists(select 1 from jsonb_array_elements(saved.content) b where b->>'type'='heading' and lower(btrim(b->>'text')) in ('source','sources'))
      or not exists(select 1 from jsonb_array_elements(saved.content) b where b->>'type'='paragraph' and b->>'text' ~ 'https?://')
    then raise exception 'Confirmez la vérification des sources et des droits avant publication.'; end if;
    if saved.hero_image_url <> '/brand/logo.svg' and coalesce(btrim(saved.image_rights_notes),'')='' then
      raise exception 'Documentez la licence ou l’autorisation de l’image.';
    end if;
    saved.reviewed_at := now(); saved.reviewed_by := auth.uid();
    if saved.status::text='scheduled' and (saved.scheduled_for is null or saved.scheduled_for<=now()) then raise exception 'La programmation doit être future.'; end if;
    if saved.status::text='published' and (saved.published_at is null or saved.published_at>now()) then raise exception 'Une date future doit être programmée.'; end if;
  else saved.reviewed_by:=null; saved.reviewed_at:=null; end if;
  if saved.featured and saved.status::text='published' then
    update public.articles set featured=false where featured and id<>saved.id;
  end if;
  if article_id is null then
    insert into public.articles select (saved).*;
  else
    update public.articles set title=saved.title,slug=saved.slug,excerpt=saved.excerpt,content=saved.content,
      hero_image_url=saved.hero_image_url,hero_image_alt=saved.hero_image_alt,image_credit=saved.image_credit,
      image_source_url=saved.image_source_url,image_rights_notes=saved.image_rights_notes,use_cms_image=saved.use_cms_image,
      category_id=saved.category_id,author_id=saved.author_id,status=saved.status,featured=saved.featured,
      published_at=saved.published_at,scheduled_for=saved.scheduled_for,seo_title=saved.seo_title,
      seo_description=saved.seo_description,correction_note=saved.correction_note,source_notes=saved.source_notes,
      editorial_notes=saved.editorial_notes,reviewed_at=saved.reviewed_at,reviewed_by=saved.reviewed_by
    where id=article_id;
  end if;
  return saved.id;
end;
$$;
revoke all on function public.save_newsroom_article(jsonb,uuid,timestamptz) from public,anon;
grant execute on function public.save_newsroom_article(jsonb,uuid,timestamptz) to authenticated;

create table public.publication_runs (
 id uuid primary key default gen_random_uuid(), started_at timestamptz not null default now(), finished_at timestamptz,
 status text not null default 'running' check(status in ('running','success','failed')),
 published_count integer not null default 0, detail jsonb not null default '[]'::jsonb, error_note text
);
alter table public.publication_runs enable row level security;
create policy "Managers can inspect publication runs" on public.publication_runs for select to authenticated using(public.is_newsroom_manager());
grant select on public.publication_runs to authenticated;
grant all on public.publication_runs to service_role;

-- Block stale authenticated sessions belonging to inactive or downgraded authors.
drop policy if exists "Staff can update permitted articles" on public.articles;
create policy "Staff can update permitted articles" on public.articles for update to authenticated
 using(public.is_newsroom_manager() or (public.is_newsroom_staff() and author_id=auth.uid() and status::text in ('draft','in_review','needs_changes')))
 with check(public.is_newsroom_manager() or (public.is_newsroom_staff() and author_id=auth.uid() and status::text in ('draft','in_review') and not featured));
drop policy if exists "Staff can update permitted article images" on storage.objects;
create policy "Staff can update permitted article images" on storage.objects for update to authenticated
 using(bucket_id='article-images' and public.is_newsroom_staff() and (public.is_newsroom_manager() or name like auth.uid()::text || '/%'))
 with check(bucket_id='article-images' and public.is_newsroom_staff() and (public.is_newsroom_manager() or name like auth.uid()::text || '/%'));

-- No table-wide SELECT: those grants would override column privacy.
revoke select on public.articles from public,anon,authenticated;
grant select(id,title,slug,excerpt,content,hero_image_url,hero_image_alt,image_credit,image_source_url,use_cms_image,
 category_id,author_id,status,featured,published_at,scheduled_for,created_at,updated_at,seo_title,seo_description,
 correction_note,reviewed_at,byline,last_edited_at) on public.articles to anon,authenticated;
-- Trigger-only functions have no public RPC use. Keep role helpers executable for RLS.
revoke execute on function public.capture_article_revision() from public,anon,authenticated;
revoke execute on function public.log_newsroom_change() from public,anon,authenticated;
revoke execute on function public.handle_new_user() from public,anon,authenticated;

-- Category metadata is public; active controls navigation/list placement, not secrecy.
drop policy if exists "Active categories are public" on public.categories;
create policy "Category metadata is public" on public.categories for select to anon,authenticated using(true);
revoke select(source_notes,editorial_notes,image_rights_notes,reviewed_by) on public.articles from public,anon,authenticated;

create or replace function public.get_newsroom_identity()
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('id',id,'full_name',full_name,'role',role,'active',active) from public.profiles where id=auth.uid();
$$;
revoke all on function public.get_newsroom_identity() from public,anon;
grant execute on function public.get_newsroom_identity() to authenticated;
create or replace function public.newsroom_mfa_satisfied()
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(auth.jwt()->>'aal','aal1')='aal2' or not exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified');
$$;
revoke all on function public.newsroom_mfa_satisfied() from public,anon;
grant execute on function public.newsroom_mfa_satisfied() to authenticated;
create or replace function public.is_newsroom_staff()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active and role in ('owner','editor','author')) and public.newsroom_mfa_satisfied();
$$;
create or replace function public.is_newsroom_manager()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active and role in ('owner','editor')) and public.newsroom_mfa_satisfied();
$$;
create or replace function public.is_newsroom_owner()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active and role='owner') and public.newsroom_mfa_satisfied();
$$;
create or replace function public.newsroom_health()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_newsroom_manager() then raise exception 'Manager access required';end if;
 return jsonb_build_object(
 'private_notes',not has_column_privilege('anon','public.articles','source_notes','select') and not has_column_privilege('anon','public.articles','editorial_notes','select') and not has_column_privilege('authenticated','public.articles','editorial_notes','select'),
 'publication_trigger',exists(select 1 from pg_trigger where tgrelid='public.articles'::regclass and tgname='require_article_publication_readiness' and not tgisinternal),
 'mfa_enabled',exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified'));
end;
$$;
revoke all on function public.newsroom_health() from public,anon;
grant execute on function public.newsroom_health() to authenticated;

create or replace function public.newsroom_editorial_alerts()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_newsroom_manager() then raise exception 'Manager access required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'slug',slug)) from public.articles where status::text='published' and content::text !~ 'https?://'),'[]'::jsonb);
end;
$$;
revoke all on function public.newsroom_editorial_alerts() from public,anon;
grant execute on function public.newsroom_editorial_alerts() to authenticated;

create or replace function public.publish_due_newsroom_article(article_id uuid, due_before timestamptz)
returns boolean language plpgsql security definer set search_path='' as $$
declare item public.articles;
begin
 perform pg_advisory_xact_lock(74138152);
 select * into item from public.articles where id=article_id and status::text='scheduled' and scheduled_for<=due_before and scheduled_for<=now() for update;
 if not found then return false; end if;
 if item.featured then update public.articles set featured=false where featured and id<>item.id;end if;
 update public.articles set status='published',published_at=coalesce(item.published_at,now()),scheduled_for=null where id=item.id;
 return true;
end;
$$;
revoke all on function public.publish_due_newsroom_article(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.publish_due_newsroom_article(uuid,timestamptz) to service_role;
create index publication_runs_started_idx on public.publication_runs(started_at desc);
notify pgrst,'reload schema';
