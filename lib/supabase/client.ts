'use client'

// Browser-side Supabase client.
// Uses @supabase/ssr's createBrowserClient with global fetch headers
// for passing anonymous session context (x-session-id) and invite codes (x-invite-code)
// to PostgREST Row Level Security policies.

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

let client: SupabaseClient | null = null

export function getActiveSessionId(): string | null {
  if (typeof document === 'undefined') return null
  try {
    // 1. Check cookie
    const match = document.cookie.match(/(^|;\s*)talkroom_session_id=([^;]*)/)
    if (match && match[2]) return decodeURIComponent(match[2])
    // 2. Check localStorage session
    const raw = localStorage.getItem('talkroom.session')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.id) return parsed.id
    }
    // 3. Check visitor id
    const visitor = localStorage.getItem('talkroom.visitor_id')
    if (visitor) return visitor
  } catch {}
  return null
}

function getActiveInviteCode(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('invite')
    if (code) return code

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith('talkroom.invite.')) {
        const val = sessionStorage.getItem(key)
        if (val) return val
      }
    }
  } catch {}
  return null
}

/**
 * Returns a singleton browser Supabase client, configured with custom headers
 * for anonymous session RLS authentication.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createBrowserClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
      global: {
        fetch: (input, init = {}) => {
          const headers = new Headers(init.headers)
          const sessionId = getActiveSessionId()
          if (sessionId && !headers.has('x-session-id')) {
            headers.set('x-session-id', sessionId)
          }
          const inviteCode = getActiveInviteCode()
          if (inviteCode && !headers.has('x-invite-code')) {
            headers.set('x-invite-code', inviteCode)
          }
          return fetch(input, { ...init, headers })
        },
      },
    })
  }
  return client
}
