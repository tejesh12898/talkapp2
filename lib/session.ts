'use client'

import type { Session } from './types'
import { upsertSession, touchSession } from './backend'

const STORAGE_KEY = 'talkroom.session'
const VISITOR_KEY = 'talkroom.visitor_id'
const COOKIE_NAME = 'talkroom_session_id'

export function genId(prefix = 'id'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}_${rnd}`
}

export function getSessionCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function setSessionCookie(sessionId: string): void {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 365 // 1 year
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return genId('sess')

  // 1. Check existing session
  const existing = getSession()
  if (existing?.id) {
    setSessionCookie(existing.id)
    return existing.id
  }

  // 2. Check cookie
  const cookieId = getSessionCookie()
  if (cookieId) {
    window.localStorage.setItem(VISITOR_KEY, cookieId)
    return cookieId
  }

  // 3. Check localStorage visitor key
  const storedVisitor = window.localStorage.getItem(VISITOR_KEY)
  if (storedVisitor) {
    setSessionCookie(storedVisitor)
    return storedVisitor
  }

  // 4. Generate new visitor ID
  const newId = genId('sess')
  window.localStorage.setItem(VISITOR_KEY, newId)
  setSessionCookie(newId)
  return newId
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.localStorage.setItem(VISITOR_KEY, session.id)
  setSessionCookie(session.id)
  window.dispatchEvent(new Event('talkroom:session'))
}

export async function createSession(nickname: string): Promise<Session> {
  const id = getOrCreateVisitorId()
  const session: Session = {
    id,
    nickname: nickname.trim(),
    avatar_seed: id,
    created_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  }
  saveSession(session)
  try {
    await upsertSession(session)
  } catch (err) {
    console.warn('Could not sync new session with Supabase:', err)
  }
  return session
}

export async function updateNickname(nickname: string): Promise<Session | null> {
  const current = getSession()
  if (!current) return null
  const updated: Session = {
    ...current,
    nickname: nickname.trim(),
    last_seen: new Date().toISOString(),
  }
  saveSession(updated)
  try {
    await upsertSession(updated)
  } catch (err) {
    console.warn('Could not sync updated nickname with Supabase:', err)
  }
  return updated
}

export async function syncSessionWithBackend(session: Session): Promise<Session> {
  try {
    return await upsertSession(session)
  } catch (err) {
    console.warn('Session sync with backend skipped/failed:', err)
    return session
  }
}

let lastHeartbeat = 0
export async function heartbeatSession(sessionId: string): Promise<void> {
  const now = Date.now()
  // Throttle heartbeat to at most once per 30 seconds
  if (now - lastHeartbeat < 30000) return
  lastHeartbeat = now
  try {
    await touchSession(sessionId)
  } catch (err) {
    console.warn('Session heartbeat touch failed:', err)
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  clearSessionCookie()
  window.dispatchEvent(new Event('talkroom:session'))
}

// ---- Blocked users (local only, no notification to blocked user) ----
const BLOCK_KEY = 'talkroom.blocked'

export function getBlocked(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(BLOCK_KEY) || '[]')
  } catch {
    return []
  }
}

export function toggleBlocked(userId: string): string[] {
  const current = getBlocked()
  const next = current.includes(userId)
    ? current.filter((id) => id !== userId)
    : [...current, userId]
  window.localStorage.setItem(BLOCK_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('talkroom:blocked'))
  return next
}
