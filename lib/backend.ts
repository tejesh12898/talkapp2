'use client'

// Unified data layer. Every screen talks to these functions and never to
// the store or Supabase directly, so switching backends is a single flag.
// When NEXT_PUBLIC_SUPABASE_* env vars exist, the Supabase branch is used;
// otherwise the in-memory mock store powers a fully interactive demo.

import { getSupabase, isSupabaseConfigured } from './supabase'
import { mockStore } from './mock-store'
import type { Member, Message, Room } from './types'

export const usingSupabase = isSupabaseConfigured

// ---------- Rooms ----------
export async function fetchRooms(): Promise<Room[]> {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('rooms')
      .select('*')
      .eq('is_discoverable', true)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => ({ ...r, online_count: 0 }) as Room)
  }
  return mockStore.listRooms()
}

export async function fetchRoom(id: string): Promise<Room | null> {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb.from('rooms').select('*').eq('id', id).single()
    if (error) return null
    return { ...data, online_count: 0 } as Room
  }
  return mockStore.getRoom(id)
}

export async function createRoom(
  room: Omit<Room, 'created_at' | 'updated_at' | 'online_count'>,
): Promise<Room> {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb.from('rooms').insert(room).select().single()
    if (error) throw error
    return { ...data, online_count: 0 } as Room
  }
  return mockStore.createRoom(room)
}

export async function updateRoom(id: string, patch: Partial<Room>): Promise<Room | null> {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('rooms')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { ...data, online_count: 0 } as Room
  }
  return mockStore.updateRoom(id, patch)
}

export async function deleteRoom(id: string): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    await sb.from('rooms').delete().eq('id', id)
    return
  }
  mockStore.deleteRoom(id)
}

// ---------- Messages ----------
export async function fetchMessages(roomId: string): Promise<Message[]> {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) throw error
    return (data ?? []) as Message[]
  }
  return mockStore.listMessages(roomId)
}

export async function sendMessage(msg: Message): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    const { error } = await sb.from('messages').insert({
      id: msg.id,
      room_id: msg.room_id,
      user_id: msg.user_id,
      nickname: msg.nickname,
      content: msg.content,
    })
    if (error) throw error
    return
  }
  // simulate a little network latency for realistic status transitions
  await new Promise((r) => setTimeout(r, 120))
  mockStore.pushMessage(msg)
}

// ---------- Presence / membership ----------
export function joinRoom(roomId: string, member: Member) {
  return mockStore.join(roomId, member)
}
export function leaveRoom(roomId: string, userId: string, nickname: string) {
  mockStore.leave(roomId, userId, nickname)
}
export function kickMember(roomId: string, userId: string) {
  mockStore.kick(roomId, userId)
}
export function listMembers(roomId: string): Member[] {
  return mockStore.listMembers(roomId)
}
export function totalOnline(): number {
  return mockStore.totalOnline()
}

// ---------- Realtime subscriptions ----------
export function subscribeRooms(cb: () => void): () => void {
  const sb = getSupabase()
  if (sb) {
    const ch = sb
      .channel('rooms-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, cb)
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }
  return mockStore.onRooms(cb)
}

export function subscribeMessages(
  roomId: string,
  onMessage: (m: Message) => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  const sb = getSupabase()
  if (sb) {
    const ch = sb
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => onMessage(payload.new as Message),
      )
      .subscribe((status) => onStatus?.(status === 'SUBSCRIBED'))
    return () => {
      sb.removeChannel(ch)
    }
  }
  onStatus?.(true)
  return mockStore.onMessages(roomId, onMessage)
}

export function subscribeMembers(roomId: string, cb: () => void): () => void {
  // In Supabase this would use presence channels; the mock store models it directly.
  return mockStore.onMembers(roomId, cb)
}
