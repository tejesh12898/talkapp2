-- TalkRoom Row Level Security (Phase 4)
-- Enforces strict RLS policies on sessions, rooms, messages, and reports.
--
-- Security rules:
-- 1. Anyone can read discoverable public rooms; only invite-holders or owners can read private rooms.
-- 2. Anyone can insert a room (as owner); only the owner can update/delete it.
-- 3. Anyone with access to a room can read its messages.
-- 4. Message insert is allowed only when user_id matches the authenticated session, content is 1-500 chars, and room is not locked.
-- 5. Reports can be inserted by any session (reporter_id = session) but are never read by other users.
-- 6. No client-side trust of owner status: owner_id is verified against authenticated session id.

-- ======================================================================
-- HELPER FUNCTIONS FOR SESSION & INVITE CONTEXT
-- ======================================================================

-- Extracts the current anonymous session ID from request headers (x-session-id) or JWT claims
create or replace function public.current_session_id()
returns text
language plpgsql
stable
as $$
declare
  hdr text;
  claims text;
  sess text;
begin
  hdr := current_setting('request.headers', true);
  if hdr is not null and hdr <> '' then
    begin
      sess := hdr::json->>'x-session-id';
      if sess is not null and sess <> '' then
        return sess;
      end if;
    exception when others then
      -- ignore parse error
    end;
  end if;

  claims := current_setting('request.jwt.claims', true);
  if claims is not null and claims <> '' then
    begin
      sess := claims::json->>'sub';
      if sess is not null and sess <> '' then
        return sess;
      end if;
    exception when others then
      -- ignore parse error
    end;
  end if;

  return null;
end;
$$;

-- Extracts invite code from request headers (x-invite-code)
create or replace function public.current_invite_code()
returns text
language plpgsql
stable
as $$
declare
  hdr text;
  code text;
begin
  hdr := current_setting('request.headers', true);
  if hdr is not null and hdr <> '' then
    begin
      code := hdr::json->>'x-invite-code';
      if code is not null and code <> '' then
        return code;
      end if;
    exception when others then
      -- ignore
    end;
  end if;
  return null;
end;
$$;

-- ======================================================================
-- DROP OLD PLACEHOLDER POLICIES
-- ======================================================================

drop policy if exists "sessions_all" on public.sessions;
drop policy if exists "rooms_select" on public.rooms;
drop policy if exists "rooms_insert" on public.rooms;
drop policy if exists "rooms_update" on public.rooms;
drop policy if exists "rooms_delete" on public.rooms;
drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;
drop policy if exists "reports_insert" on public.reports;

-- ======================================================================
-- 1. SESSIONS POLICIES
-- ======================================================================

-- Anyone can read sessions (required for rendering chat avatars & nicknames)
create policy "sessions_select" on public.sessions
  for select using (true);

-- Visitors can insert their own session
create policy "sessions_insert" on public.sessions
  for insert with check (
    char_length(nickname) between 2 and 20
    and (id = public.current_session_id() or public.current_session_id() is null)
  );

-- Users can only update their own session (nickname, avatar, last_seen)
create policy "sessions_update" on public.sessions
  for update using (
    id = public.current_session_id()
  ) with check (
    id = public.current_session_id()
    and char_length(nickname) between 2 and 20
  );

-- Users can only delete their own session
create policy "sessions_delete" on public.sessions
  for delete using (
    id = public.current_session_id()
  );

-- ======================================================================
-- 2. ROOMS POLICIES
-- ======================================================================

-- Public discoverable rooms are visible to everyone.
-- Private rooms are only visible to the owner or users with a matching invite code.
create policy "rooms_select" on public.rooms
  for select using (
    (not is_private and is_discoverable)
    or (owner_id = public.current_session_id())
    or (is_private and invite_code is not null and invite_code = public.current_invite_code())
  );

-- Anyone can create a room, but owner_id MUST match their current session ID
create policy "rooms_insert" on public.rooms
  for insert with check (
    owner_id = public.current_session_id()
    and char_length(name) between 1 and 40
    and char_length(description) <= 140
    and max_users between 2 and 100
  );

-- Only the room owner can update room details (e.g. rename, lock, description)
create policy "rooms_update" on public.rooms
  for update using (
    owner_id = public.current_session_id()
  ) with check (
    owner_id = public.current_session_id()
    and char_length(name) between 1 and 40
    and char_length(description) <= 140
    and max_users between 2 and 100
  );

-- Only the room owner can delete the room
create policy "rooms_delete" on public.rooms
  for delete using (
    owner_id = public.current_session_id()
  );

-- ======================================================================
-- 3. MESSAGES POLICIES
-- ======================================================================

-- Users can read messages in rooms they have access to (public or owner or invite)
create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.rooms r
      where r.id = messages.room_id
      and (
        (not r.is_private)
        or (r.owner_id = public.current_session_id())
        or (r.invite_code is not null and r.invite_code = public.current_invite_code())
      )
    )
  );

-- Users can only insert messages if user_id matches their session ID,
-- content is non-empty (1-500 chars), and the room is not locked
create policy "messages_insert" on public.messages
  for insert with check (
    user_id = public.current_session_id()
    and char_length(content) between 1 and 500
    and exists (
      select 1 from public.rooms r
      where r.id = messages.room_id
      and not r.is_locked
    )
  );

-- Messages cannot be edited after sending
create policy "messages_update" on public.messages
  for update using (false);

-- Messages can only be deleted by the author or the room owner
create policy "messages_delete" on public.messages
  for delete using (
    user_id = public.current_session_id()
    or exists (
      select 1 from public.rooms r
      where r.id = messages.room_id
      and r.owner_id = public.current_session_id()
    )
  );

-- ======================================================================
-- 4. REPORTS POLICIES
-- ======================================================================

-- Anyone can submit a report, but reporter_id MUST match their session ID
create policy "reports_insert" on public.reports
  for insert with check (
    reporter_id = public.current_session_id()
    and char_length(reason) between 1 and 50
  );

-- Clients can only see reports they submitted themselves (admin service role bypasses RLS)
create policy "reports_select" on public.reports
  for select using (
    reporter_id = public.current_session_id()
  );

create policy "reports_update" on public.reports
  for update using (false);

create policy "reports_delete" on public.reports
  for delete using (false);
