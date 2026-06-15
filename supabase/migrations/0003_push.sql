-- ════════════════════════════════════════════════════════════════════════════
-- OpenLoop — push notifications
--   * push_subscriptions: Web Push endpoints registered by the PWA.
--   * items.*_notified_at: idempotency stamps so each due/resurface fires once.
-- ════════════════════════════════════════════════════════════════════════════

create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_owner_idx on push_subscriptions (owner_id);

alter table push_subscriptions enable row level security;

create policy "owner manages own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- One-shot notification stamps.
alter table items add column due_notified_at       timestamptz;
alter table items add column resurface_notified_at timestamptz;
