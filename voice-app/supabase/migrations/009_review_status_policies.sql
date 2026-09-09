-- This follows 008 in a separate transaction because PostgreSQL only permits
-- newly added enum values to be referenced after the enum migration commits.
-- Authors can submit their own work for review but cannot publish, schedule,
-- archive, or feature it. Editors and owners remain the approval authority.
drop policy if exists "Staff can create permitted articles" on public.articles;
create policy "Staff can create permitted articles"
on public.articles for insert to authenticated
with check (
  (select public.is_newsroom_staff())
  and author_id = (select auth.uid())
  and (
    (select public.is_newsroom_manager())
    or (status in ('draft', 'in_review') and featured = false)
  )
);

drop policy if exists "Staff can update permitted articles" on public.articles;
create policy "Staff can update permitted articles"
on public.articles for update to authenticated
using (
  author_id = (select auth.uid())
  or (select public.is_newsroom_manager())
)
with check (
  (select public.is_newsroom_manager())
  or (
    author_id = (select auth.uid())
    and status in ('draft', 'in_review', 'needs_changes')
    and featured = false
  )
);
