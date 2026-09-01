// Shared validation + sanitization used on both the client and the
// (mock) server layer. Length and content rules are enforced here so the
// same checks apply when swapping to Supabase edge functions / RLS.

export const NICKNAME_MAX = 20
export const MESSAGE_MAX = 500
export const ROOM_NAME_MAX = 40
export const ROOM_DESC_MAX = 140

// Basic disallowed-name filter (spam / impersonation / slurs stand-in).
const BANNED_NAME_PATTERNS = [
  /admin/i,
  /moderator/i,
  /talkroom/i,
  /support/i,
  /system/i,
  /f+u+c+k/i,
  /\bn[i1]gg/i,
  /http/i,
  /www\./i,
]

export function sanitizeText(input: string): string {
  // Strip control chars and collapse excessive whitespace. React already
  // escapes rendered text, preventing XSS; this keeps stored content clean.
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s{3,}/g, '  ')
}

export function validateNickname(raw: string): {
  ok: boolean
  value: string
  error?: string
} {
  const value = raw.trim()
  if (!value) return { ok: false, value, error: 'Pick a nickname to continue.' }
  if (value.length > NICKNAME_MAX)
    return { ok: false, value, error: `Keep it under ${NICKNAME_MAX} characters.` }
  if (value.length < 2)
    return { ok: false, value, error: 'That is a little too short.' }
  if (BANNED_NAME_PATTERNS.some((p) => p.test(value)))
    return { ok: false, value, error: 'That nickname is not allowed.' }
  return { ok: true, value }
}

export function validateRoomName(raw: string): {
  ok: boolean
  value: string
  error?: string
} {
  const value = raw.trim()
  if (!value) return { ok: false, value, error: 'Give your room a name.' }
  if (value.length > ROOM_NAME_MAX)
    return { ok: false, value, error: `Keep it under ${ROOM_NAME_MAX} characters.` }
  return { ok: true, value }
}

export function validateMessage(raw: string): {
  ok: boolean
  value: string
  error?: string
} {
  const value = sanitizeText(raw).trim()
  if (!value) return { ok: false, value, error: 'Message is empty.' }
  if (value.length > MESSAGE_MAX)
    return { ok: false, value, error: `Messages are limited to ${MESSAGE_MAX} characters.` }
  return { ok: true, value }
}

export function genInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 5; i++)
    out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const s = Math.floor(diff / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}
