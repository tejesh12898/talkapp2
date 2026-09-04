'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createSession,
  getSession,
  updateNickname as persistNickname,
  getOrCreateVisitorId,
  syncSessionWithBackend,
  heartbeatSession,
} from '@/lib/session'
import type { Session } from '@/lib/types'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Ensure visitor ID exists in cookie / localStorage on initial visit
    getOrCreateVisitorId()

    // Load initial local session
    const current = getSession()
    setSession(current)
    setReady(true)

    // If already has an active session, sync and touch in background
    if (current) {
      syncSessionWithBackend(current).catch(() => {})
      heartbeatSession(current.id).catch(() => {})
    }

    const sync = () => setSession(getSession())
    window.addEventListener('talkroom:session', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('talkroom:session', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Heartbeat & activity tracking for active session
  useEffect(() => {
    if (!session?.id) return

    // Periodic heartbeat every 45 seconds
    const interval = setInterval(() => {
      heartbeatSession(session.id).catch(() => {})
    }, 45000)

    // Activity tracking: update last_seen on window focus or visibility change
    const onActivity = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        heartbeatSession(session.id).catch(() => {})
      }
    }

    window.addEventListener('focus', onActivity)
    document.addEventListener('visibilitychange', onActivity)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onActivity)
      document.removeEventListener('visibilitychange', onActivity)
    }
  }, [session?.id])

  const signIn = useCallback(async (nickname: string) => {
    const s = await createSession(nickname)
    setSession(s)
    return s
  }, [])

  const rename = useCallback(async (nickname: string) => {
    const s = await persistNickname(nickname)
    if (s) setSession(s)
    return s
  }, [])

  return { session, ready, signIn, rename }
}
