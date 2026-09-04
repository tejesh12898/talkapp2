'use client'

// Unified data layer. Every screen talks to these functions and never to
// the store or Supabase directly, so switching backends is a single flag.
// When NEXT_PUBLIC_SUPABASE_* env vars exist, the Supabase branch is used;
// otherwise the in-memory mock store powers a fully interactive demo.

import { getActiveSessionId, getSupabase, isSupabaseConfigured } from './supabase/client'
import { mockStore } from './mock-store'
import type { Category, Member, Message, ReportReason, Room, RoomFilter, Session } from './types'

export const usingSupabase = isSupabaseConfigured

// ---------- Sessions ----------
export async function upsertSession(session: Session): Promise<Session> {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('sessions')
      .upsert({
        id: session.id,
        nickname: session.nickname,
        avatar_seed: session.avatar_seed,
        last_seen: session.last_seen || new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      console.error('Failed to upsert session to Supabase:', error)
      throw error
    }
    return data as Session
  }
  return session
}

export async function touchSession(sessionId: string): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    const { error } = await sb
      .from('sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) {
      console.warn('Failed to touch session:', error)
    }
  }
}

export async function fetchSession(sessionId: string): Promise<Session | null> {
  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle()
    if (error || !data) return null
    return data as Session
  }
  return null
}

export interface FetchRoomsOptions {
  category?: Category | 'All'
  search?: string
  filter?: RoomFilter
}

// ---------- Rooms ----------
export async function fetchRooms(options?: FetchRoomsOptions): Promise<Room[]> {
  const sb = getSupabase()
  if (sb) {
    let query = sb
      .from('rooms')
      .select('*')
      .eq('is_discoverable', true)

    if (options?.category && options.category !== 'All') {
      query = query.eq('category', options.category)
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim()
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
    }

    if (options?.filter === 'New') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('updated_at', { ascending: false })
    }

    const { data, error } = await query
    if (error) {
      console.error('Failed to fetch rooms from Supabase:', error)
      throw error
    }
    return (data ?? []).map((r) => ({ ...r, online_count: 0 }) as Room)
  }
  return mockStore.listRooms()
}

export async function fetchRoom(id: string, inviteCode?: string): Promise<Room | null> {
  const code =
    inviteCode ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem(`talkroom.invite.${id}`) ||
        new URLSearchParams(window.location.search).get('invite')
      : null)

  if (typeof window !== 'undefined' && code) {
    sessionStorage.setItem(`talkroom.invite.${id}`, code)
  }

  const sb = getSupabase()
  if (sb) {
    const { data, error } = await sb.from('rooms').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
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
    if (error) {
      console.error('Failed to create room in Supabase:', error)
      throw error
    }
    if (room.is_private && room.invite_code && typeof window !== 'undefined') {
      sessionStorage.setItem(`talkroom.invite.${data.id}`, room.invite_code)
    }
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
      .maybeSingle()
    if (error) {
      console.error('Failed to update room in Supabase:', error)
      throw error
    }
    if (!data) return null
    return { ...data, online_count: 0 } as Room
  }
  return mockStore.updateRoom(id, patch)
}

export async function deleteRoom(id: string): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    const { error } = await sb.from('rooms').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete room in Supabase:', error)
      throw error
    }
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
      avatar_seed: msg.avatar_seed || msg.user_id,
      content: msg.content,
    })
    if (error) {
      console.error('Failed to send message to Supabase:', error)
      throw error
    }
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
  const sb = getSupabase()
  if (sb) {
    const topic = `room-${roomId}-presence`
    const channel =
      sb.getChannels().find((c) => c.topic === `realtime:${topic}` || c.topic === topic) ||
      sb.channel(topic)
    channel.send({
      type: 'broadcast',
      event: 'kick_user',
      payload: { user_id: userId, room_id: roomId },
    })
    return
  }
  mockStore.kick(roomId, userId)
}

export function muteMember(roomId: string, userId: string) {
  const sb = getSupabase()
  if (sb) {
    const topic = `room-${roomId}-presence`
    const channel =
      sb.getChannels().find((c) => c.topic === `realtime:${topic}` || c.topic === topic) ||
      sb.channel(topic)
    channel.send({
      type: 'broadcast',
      event: 'mute_user',
      payload: { user_id: userId, room_id: roomId },
    })
  }
}

// ---------- Reports ----------
export async function createReport(report: {
  room_id: string
  reported_user_id?: string | null
  message_id?: string | null
  reason: ReportReason
  description?: string
}): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    const sessionId = getActiveSessionId() || 'sess_anon'
    const { error } = await sb.from('reports').insert({
      reporter_id: sessionId,
      reported_user_id: report.reported_user_id ?? null,
      message_id: report.message_id ?? null,
      room_id: report.room_id,
      reason: report.reason,
      description: report.description?.trim() ?? '',
    })
    if (error) {
      console.error('Failed to submit report to Supabase:', error)
      throw error
    }
    return
  }
}
export function listMembers(roomId: string): Member[] {
  return mockStore.listMembers(roomId)
}
export async function fetchTotalOnline(): Promise<number> {
  const sb = getSupabase()
  if (sb) {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { count, error } = await sb
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', twoMinutesAgo)
    if (!error && typeof count === 'number') {
      return count
    }
    return 0
  }
  return mockStore.totalOnline()
}

export function totalOnline(): number {
  return mockStore.totalOnline()
}

// ---------- Realtime subscriptions ----------
export function subscribeRooms(cb: () => void): () => void {
  const sb = getSupabase()
  if (sb) {
    const topic = `rooms-feed-${Math.random().toString(36).slice(2)}`
    const ch = sb
      .channel(topic)
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
  onDelete?: (messageId: string) => void,
): () => void {
  const sb = getSupabase()
  if (sb) {
    const topic = `room-${roomId}-messages-${Math.random().toString(36).slice(2)}`
    const ch = sb
      .channel(topic)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => onMessage(payload.new as Message),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => onDelete?.(payload.old?.id),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          onStatus?.(true)
        } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          onStatus?.(false)
        }
      })
    return () => {
      sb.removeChannel(ch)
    }
  }
  onStatus?.(true)
  return mockStore.onMessages(roomId, onMessage)
}

export interface PresenceCallbacks {
  onSync: (members: Member[]) => void
  onJoin?: (member: Member) => void
  onLeave?: (member: Member) => void
  onKick?: (userId: string) => void
  onMute?: (userId: string) => void
}

export function subscribePresence(
  roomId: string,
  currentMember: Member,
  callbacks: PresenceCallbacks,
): () => void {
  const sb = getSupabase()
  if (sb) {
    const topic = `room-${roomId}-presence`
    // If a channel with this topic is already registered, remove it first to avoid duplicate subscription collisions
    const existing = sb.getChannels().find((c) => c.topic === `realtime:${topic}` || c.topic === topic)
    if (existing) {
      sb.removeChannel(existing)
    }

    const channel = sb.channel(topic, {
      config: {
        presence: {
          key: currentMember.user_id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<Member>()
        const memberMap = new Map<string, Member>()
        for (const key of Object.keys(state)) {
          const presences = state[key]
          if (presences && presences.length > 0) {
            const m = presences[presences.length - 1]
            memberMap.set(m.user_id, m)
          }
        }
        callbacks.onSync(Array.from(memberMap.values()))
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (callbacks.onJoin && newPresences) {
          for (const raw of newPresences) {
            const m = raw as unknown as Member
            callbacks.onJoin(m)
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (callbacks.onLeave && leftPresences) {
          for (const raw of leftPresences) {
            const m = raw as unknown as Member
            callbacks.onLeave(m)
          }
        }
      })
      .on('broadcast', { event: 'kick_user' }, ({ payload }) => {
        if (payload?.user_id) callbacks.onKick?.(payload.user_id)
      })
      .on('broadcast', { event: 'mute_user' }, ({ payload }) => {
        if (payload?.user_id) callbacks.onMute?.(payload.user_id)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentMember.user_id,
            nickname: currentMember.nickname,
            avatar_seed: currentMember.avatar_seed,
            is_owner: currentMember.is_owner,
            joined_at: currentMember.joined_at,
          })
        }
      })

    const handleBeforeUnload = () => {
      channel.untrack()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
      channel.untrack().catch(() => {})
      sb.removeChannel(channel)
    }
  }

  // Fallback to mock store
  mockStore.join(roomId, currentMember)
  callbacks.onSync(mockStore.listMembers(roomId))
  const unsub = mockStore.onMembers(roomId, () => {
    callbacks.onSync(mockStore.listMembers(roomId))
  })
  return () => {
    unsub()
    mockStore.leave(roomId, currentMember.user_id, currentMember.nickname)
  }
}

export function subscribeMembers(roomId: string, cb: () => void): () => void {
  return mockStore.onMembers(roomId, cb)
}
