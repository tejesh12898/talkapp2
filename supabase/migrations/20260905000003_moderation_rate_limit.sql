-- TalkRoom Moderation & Rate Limiting (Phase 8)
-- Adds a server-side rate limit trigger on messages to prevent spam flooding.

create or replace function public.check_message_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count int;
begin
  -- Count messages sent by this session in the last 3 seconds
  select count(*) into recent_count
  from public.messages
  where user_id = NEW.user_id
    and created_at > (now() - interval '3 seconds');

  -- Allow at most 3 messages per 3 seconds per user
  if recent_count >= 3 then
    raise exception 'You''re sending messages too fast'
      using errcode = 'P0001',
            hint = 'Please wait a moment before sending another message.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_message_rate_limit on public.messages;
create trigger trg_message_rate_limit
  before insert on public.messages
  for each row
  execute function public.check_message_rate_limit();
