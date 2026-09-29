-- Trigger logic only references NEW/OLD row fields and pg_catalog functions.
-- An empty search_path prevents name shadowing if schemas or objects are added.
alter function public.set_article_last_edited_at() set search_path = '';
