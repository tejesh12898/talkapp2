-- TalkRoom Realtime Publication & Replica Identity Setup
-- Enables REPLICA IDENTITY FULL so Realtime broadcasts receive complete row payloads
-- Simplifies messages SELECT policy so the Realtime WAL engine can broadcast inserts without subquery joins

alter table public.rooms replica identity full;
alter table public.messages replica identity full;

drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (true);
