-- ════════════════════════════════════════════════════════════════════════════
-- OpenLoop — storage bucket for attachments + AI search RPC
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Attachments storage bucket ───────────────────────────────────────────────
-- Private bucket; the app serves files via signed URLs / authenticated access.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Owners can manage only objects under their own folder (objects are stored at
-- `<owner_id>/<item_id>/<filename>`).
create policy "owner reads own attachment files"
  on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner writes own attachment files"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner updates own attachment files"
  on storage.objects for update
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner deletes own attachment files"
  on storage.objects for delete
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── AI / full-text search RPC ────────────────────────────────────────────────
-- A SECURITY DEFINER function so the AI search API route (service role, acting
-- for the single owner) can run fuzzy ranked search across all items.
-- Ranking blends trigram similarity with a small recency boost.
create or replace function search_items(
  p_owner uuid,
  p_query text,
  p_kind  item_kind default null,
  p_limit int default 25
)
returns table (
  id uuid,
  kind item_kind,
  status item_status,
  title text,
  description text,
  body text,
  tags text[],
  due_date timestamptz,
  resurface_date timestamptz,
  updated_at timestamptz,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id, i.kind, i.status, i.title, i.description, i.body, i.tags,
    i.due_date, i.resurface_date, i.updated_at,
    similarity(
      coalesce(i.title,'') || ' ' || coalesce(i.description,'') || ' ' || coalesce(i.body,''),
      p_query
    ) as rank
  from items i
  where i.owner_id = p_owner
    and (p_kind is null or i.kind = p_kind)
    and (
      p_query = '' or
      (coalesce(i.title,'') || ' ' || coalesce(i.description,'') || ' ' || coalesce(i.body,''))
        ilike '%' || p_query || '%'
      or similarity(
           coalesce(i.title,'') || ' ' || coalesce(i.description,'') || ' ' || coalesce(i.body,''),
           p_query
         ) > 0.1
    )
  order by rank desc nulls last, i.updated_at desc
  limit greatest(1, least(p_limit, 100));
$$;
