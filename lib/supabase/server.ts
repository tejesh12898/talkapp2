// Server-side Supabase client for use in Server Components, Route Handlers,
// and Server Actions. Creates a fresh client per request with cookie access.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Create a Supabase client for server-side use (Server Components, Route
 * Handlers, Server Actions). Returns `null` when env vars are missing.
 *
 * IMPORTANT: Must be called inside a request context (not at module scope)
 * because it reads cookies.
 */
export async function createSupabaseServer(): Promise<SupabaseClient | null> {
  if (!url || !anonKey) return null

  const cookieStore = await cookies()
  const sessionId = cookieStore.get('talkroom_session_id')?.value

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll can fail in Server Components (read-only context).
          // This is fine — cookie writes only matter in Route Handlers
          // and Server Actions where the response is still mutable.
        }
      },
    },
    global: {
      fetch: (input, init = {}) => {
        const headers = new Headers(init.headers)
        if (sessionId && !headers.has('x-session-id')) {
          headers.set('x-session-id', sessionId)
        }
        return fetch(input, { ...init, headers })
      },
    },
  })
}
