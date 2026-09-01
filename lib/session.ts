'use client'

import type { Session } from './types'

const STORAGE_KEY = 'talkroom.session'

export function genId(prefix = 'id'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}_${rnd}`
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
  window.dispatchEvent(new Event('talkroom:session'))
}

export function createSession(nickname: string): Session {
  const id = genId('sess')
  const session: Session = {
    id,
    nickname: nickname.trim(),
    avatar_seed: id,
    created_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  }
  saveSession(session)
  return session
}

export function updateNickname(nickname: string): Session | null {
  const current = getSession()
  if (!current) return null
  const updated: Session = { ...current, nickname: nickname.trim() }
  saveSession(updated)
  return updated
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
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
