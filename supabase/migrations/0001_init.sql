-- ════════════════════════════════════════════════════════════════════════════
-- OpenLoop — initial schema
-- A private GTD + PARA workspace: Next Steps, Outcomes, Thoughts, Resources.
--
-- Design notes:
--  * A single `items` table holds all four types (polymorphic via `kind`).
--    This keeps Quick Capture, the Intake queue, and AI search trivially simple
--    — one place to write, one place to query — while type-specific fields live
--    in dedicated columns (nullable) plus a `metadata` jsonb escape hatch.
--  * `attachments` covers links, documents, and images for any item.
--  * `templates` + `template_steps` power Outcome templates (pre-loaded Next
--    Steps) and Thought templates (writing prompts).
--  * Recurrence columns exist now (schema-ready) even though the recurrence
--    engine is a later phase.
--  * Row Level Security scopes everything to the owning auth user.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ─── Enums ────────────────────────────────────────────────────────────────────

-- The four PARA elements, in OpenLoop's vocabulary.
create type item_kind as enum ('next_step', 'outcome', 'thought', 'resource');

-- Workflow status. `intake` = freshly captured, not yet processed.
create type item_status as enum (
  'intake',     -- captured, awaiting processing
  'next',       -- ready to act on
  'active',     -- in progress / an active outcome
  'waiting',    -- waiting on someone/something
  'someday',    -- someday / maybe
  'done',       -- completed
  'archived'    -- archived / reference kept
);

create type energy_level as enum ('low', 'medium', 'high');
create type priority_level as enum ('none', 'low', 'medium', 'high', 'urgent');
create type attachment_kind as enum ('link', 'document', 'image');
create type template_kind as enum ('outcome', 'thought');
create type capture_source as enum ('web', 'quick_capture', 'telegram', 'ai', 'template');

-- ─── items ────────────────────────────────────────────────────────────────────

create table items (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- Type may be null at quick-capture time and assigned during processing.
  kind            item_kind,
  status          item_status not null default 'intake',

  title           text not null default '',
  description     text,             -- short description (all kinds)
  body            text,             -- long-form content (primarily Thoughts)

  -- GTD attributes, filled in during Intake processing.
  energy          energy_level,
  priority        priority_level not null default 'none',
  tags            text[] not null default '{}',

  -- Dates.
  due_date        timestamptz,
  scheduled_date  timestamptz,      -- when you plan to start/do it
  resurface_date  timestamptz,      -- when it should reappear in Intake
  completed_at    timestamptz,

  -- Relationships.
  parent_id       uuid references items (id) on delete set null, -- Next Step → Outcome

  -- Resource-specific primary link (resources also support multiple attachments).
  url             text,

  -- Recurrence (schema-ready; engine is a later phase). Stores an iCal-style
  -- RRULE plus a pointer to the series template item.
  recurrence_rule text,
  recurrence_parent_id uuid references items (id) on delete set null,

  -- Provenance + extensibility.
  source          capture_source not null default 'web',
  template_id     uuid,             -- if spawned from a template
  metadata        jsonb not null default '{}'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index items_owner_idx        on items (owner_id);
create index items_kind_idx         on items (owner_id, kind);
create index items_status_idx       on items (owner_id, status);
create index items_parent_idx       on items (parent_id);
create index items_resurface_idx    on items (owner_id, resurface_date);
create index items_due_idx          on items (owner_id, due_date);
create index items_tags_idx         on items using gin (tags);
-- Trigram index for fast fuzzy AI/text search over title + description + body.
create index items_search_idx on items using gin (
  (coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(body,'')) gin_trgm_ops
);

-- ─── attachments ────────────────────────────────────────────────────────────

create table attachments (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id     uuid not null references items (id) on delete cascade,
  kind        attachment_kind not null,
  url         text,               -- for links, or the public storage URL
  storage_path text,              -- path within the `attachments` storage bucket
  title       text,
  mime_type   text,
  size_bytes  bigint,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index attachments_item_idx on attachments (item_id);

-- ─── templates ──────────────────────────────────────────────────────────────

create table templates (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        template_kind not null,
  name        text not null,
  description text,
  -- For Thought templates: the writing prompt / scaffold. For Outcome
  -- templates: optional default description applied to the spawned Outcome.
  prompt      text,
  -- Default tags / metadata to copy onto items created from this template.
  default_tags text[] not null default '{}',
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index templates_kind_idx on templates (owner_id, kind);

-- Pre-assigned Next Steps for an Outcome template
-- (e.g. "Spring Home Maintenance" → mow pasture, clean gutters, trim bushes).
create table template_steps (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates (id) on delete cascade,
  title       text not null,
  description text,
  energy      energy_level,
  priority    priority_level not null default 'none',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index template_steps_template_idx on template_steps (template_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

create trigger templates_set_updated_at
  before update on templates
  for each row execute function set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Single-tenant in practice, but scoped per-user so it is safe by construction.

alter table items          enable row level security;
alter table attachments    enable row level security;
alter table templates      enable row level security;
alter table template_steps enable row level security;

create policy "owner can do everything on items"
  on items for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner can do everything on attachments"
  on attachments for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner can do everything on templates"
  on templates for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- template_steps inherit ownership through their parent template.
create policy "owner can do everything on template_steps"
  on template_steps for all
  using (
    exists (
      select 1 from templates t
      where t.id = template_steps.template_id and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from templates t
      where t.id = template_steps.template_id and t.owner_id = auth.uid()
    )
  );
