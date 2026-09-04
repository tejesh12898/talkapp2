-- TalkRoom initial schema migration
-- Creates all four core tables, indexes, enables RLS, and sets
-- permissive placeholder policies (tightened in Phase 4).
--
-- Primary keys use `text` (not uuid) because the app generates
-- prefixed IDs like `room_<uuid>`, `sess_<uuid>` via client code.

-- ======================================================================
-- TABLES
-- ======================================================================

-- Sessions: anonymous visitors identified by a client-generated id.
-- No email/password — identity is a nickname + device-local session.
create table if not exists public.sessions (
  id            text primary key,
  nickname      text not null check (char_length(nickname) between 2 and 20),
  avatar_seed   text not null,
  created_at    timestamptz not null default now(),
  last_seen     timestamptz not null default now()
);

-- Rooms: chat spaces with categories, capacity limits, and privacy.
create table if not exists public.rooms (
  id              text primary key,
  name            text not null check (char_length(name) between 1 and 40),
  description     text not null default '' check (char_length(description) <= 140),
  category        text not null default 'General',
  owner_id        text not null,
  max_users       int  not null default 25 check (max_users between 2 and 100),
  is_private      boolean not null default false,
  invite_code     text,
  is_discoverable boolean not null default true,
  is_locked       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Messages: chat messages scoped to a room. Cascade-deletes when
-- the parent room is removed.
create table if not exists public.messages (
  id          text primary key,
  room_id     text not null references public.rooms (id) on delete cascade,
  user_id     text not null,
  nickname    text not null,
  avatar_seed text not null default '',
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz not null default now()
);

-- Reports: user/message reports for moderation. Write-only from clients.
create table if not exists public.reports (
  id                text primary key default gen_random_uuid()::text,
  reporter_id       text not null,
  reported_user_id  text,
  message_id        text references public.messages (id) on delete set null,
  room_id           text not null references public.rooms (id) on delete cascade,
  reason            text not null,
  description       text not null default '',
  created_at        timestamptz not null default now()
);

-- ======================================================================
-- INDEXES
-- ======================================================================

-- Fast message lookup by room, ordered chronologically
create index if not exists messages_room_created_idx
  on public.messages (room_id, created_at);

-- Fast discoverable room listing, sorted by recent activity
create index if not exists rooms_discoverable_idx
  on public.rooms (is_discoverable, updated_at desc);

-- Fast session lookup by last_seen (for stale session cleanup)
create index if not exists sessions_last_seen_idx
  on public.sessions (last_seen);

-- Fast report lookup by room
create index if not exists reports_room_idx
  on public.reports (room_id, created_at);

-- ======================================================================
-- ROW LEVEL SECURITY (permissive placeholders — tightened in Phase 4)
-- ======================================================================

alter table public.sessions enable row level security;
alter table public.rooms    enable row level security;
alter table public.messages enable row level security;
alter table public.reports  enable row level security;

-- Sessions: full access (Phase 4 will scope to own session)
create policy "sessions_all" on public.sessions
  for all using (true) with check (true);

-- Rooms: read all, insert/update/delete all (Phase 4 will scope mutations to owner)
create policy "rooms_select" on public.rooms
  for select using (true);
create policy "rooms_insert" on public.rooms
  for insert with check (true);
create policy "rooms_update" on public.rooms
  for update using (true) with check (true);
create policy "rooms_delete" on public.rooms
  for delete using (true);

-- Messages: read all, insert with content length check
create policy "messages_select" on public.messages
  for select using (true);
create policy "messages_insert" on public.messages
  for insert with check (char_length(content) between 1 and 500);

-- Reports: insert only (no client reads)
create policy "reports_insert" on public.reports
  for insert with check (true);

-- ======================================================================
-- REALTIME
-- ======================================================================
-- Enable Supabase Realtime replication for rooms and messages tables.
-- This allows the app to subscribe to INSERT/UPDATE/DELETE events.

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.messages;
