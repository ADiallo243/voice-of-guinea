-- Keep common joins and cascading deletes efficient as newsroom history grows.
create index if not exists activity_log_actor_id_idx
  on public.activity_log (actor_id);
create index if not exists article_revisions_changed_by_idx
  on public.article_revisions (changed_by);
create index if not exists articles_author_id_idx
  on public.articles (author_id);
create index if not exists articles_reviewed_by_idx
  on public.articles (reviewed_by);
create index if not exists breaking_news_article_id_idx
  on public.breaking_news (article_id);
create index if not exists breaking_news_created_by_idx
  on public.breaking_news (created_by);
