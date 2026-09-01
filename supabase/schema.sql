-- TalkRoom schema for Supabase (Postgres + Realtime).
-- Run this in the Supabase SQL editor, then enable Realtime on the
-- `rooms` and `messages` tables (Database → Replication).
--
-- Anonymous model: users are temporary sessions identified by a client
-- generated id. No email/password, no personal data. RLS is written so
-- reads are public for discoverable rooms while writes are constrained.

-- ----------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------

create table if not exists public.sessions (
  id text primary key,
  nickname text not null check (char_length(nickname) between 2 and 20),
  avatar_seed text not null,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists public.rooms (
  id text primary key,
  name text not null check (char_length(name) between 1 and 40),
  description text not null default '' check (char_length(description) <= 140),
  category text not null default 'General',
  owner_id text not null,
  max_users int not null default 25 check (max_users between 2 and 100),
  is_private boolean not null default false,
  invite_code text,
  is_discoverable boolean not null default true,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  room_id text not null references public.rooms (id) on delete cascade,
  user_id text not null,
  nickname text not null,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id text primary key default gen_random_uuid()::text,
  reporter_id text not null,
  reported_user_id text,
  message_id text,
  room_id text not null,
  reason text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx
  on public.messages (room_id, created_at);
create index if not exists rooms_discoverable_idx
  on public.rooms (is_discoverable, updated_at desc);

-- ----------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.sessions enable row level security;
alter table public.reports enable row level security;

-- Rooms: anyone can read discoverable or private (join-by-link) rooms.
create policy "rooms readable" on public.rooms
  for select using (true);
create policy "rooms insertable" on public.rooms
  for insert with check (true);
-- Only the owner can mutate a room (owner_id supplied by the client session).
create policy "rooms owner update" on public.rooms
  for update using (true) with check (true);
create policy "rooms owner delete" on public.rooms
  for delete using (true);

-- Messages: readable by all; inserts are length-checked by the column
-- constraint above. Deletion restricted (moderation happens server-side).
create policy "messages readable" on public.messages
  for select using (true);
create policy "messages insertable" on public.messages
  for insert with check (char_length(content) between 1 and 500);

-- Sessions: a client can upsert its own row.
create policy "sessions manage" on public.sessions
  for all using (true) with check (true);

-- Reports: write-only from clients; no public read.
create policy "reports insertable" on public.reports
  for insert with check (true);

-- Note: the permissive policies above are a starting point for the
-- anonymous model. Tighten update/delete with a verified session claim
-- (e.g. a JWT `sub` matching owner_id) before going to production.
