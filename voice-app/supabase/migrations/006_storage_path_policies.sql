-- Each newsroom member can upload and replace only images in their own UUID folder.
-- Owners and editors retain access to every article image for editorial support.
drop policy if exists "Newsroom staff can upload article images" on storage.objects;
drop policy if exists "Newsroom staff can update article images" on storage.objects;

create policy "Staff can upload their own article images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'article-images'
  and (select public.is_newsroom_staff())
  and name like ((select auth.uid())::text || '/%')
);

create policy "Staff can update permitted article images"
on storage.objects for update to authenticated
using (
  bucket_id = 'article-images'
  and (
    (select public.is_newsroom_manager())
    or name like ((select auth.uid())::text || '/%')
  )
)
with check (
  bucket_id = 'article-images'
  and (
    (select public.is_newsroom_manager())
    or name like ((select auth.uid())::text || '/%')
  )
);
