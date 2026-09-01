'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createSession,
  getSession,
  updateNickname as persistNickname,
} from '@/lib/session'
import type { Session } from '@/lib/types'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSession(getSession())
    setReady(true)
    const sync = () => setSession(getSession())
    window.addEventListener('talkroom:session', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('talkroom:session', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const signIn = useCallback((nickname: string) => {
    const s = createSession(nickname)
    setSession(s)
    return s
  }, [])

  const rename = useCallback((nickname: string) => {
    const s = persistNickname(nickname)
    if (s) setSession(s)
    return s
  }, [])

  return { session, ready, signIn, rename }
}
