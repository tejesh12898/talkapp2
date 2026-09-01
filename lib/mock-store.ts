'use client'

// In-memory mock backend. A module-level singleton so state survives
// client-side navigation. Simulates Realtime by emitting events and by
// generating ambient activity (bots joining/leaving/talking) so rooms
// never look static. Structured to mirror the Supabase data layer.

import { ambientLine, BOTS, SEED_ROOMS, seedMessages, type Bot } from './mock-data'
import type { Member, Message, Room } from './types'
import { genId } from './session'

type Listener = () => void
type MessageListener = (m: Message) => void

interface RoomRuntime {
  members: Map<string, Member>
  messages: Message[]
  bots: Bot[]
}

class MockStore {
  private rooms = new Map<string, Room>()
  private runtime = new Map<string, RoomRuntime>()
  private roomListeners = new Set<Listener>()
  private msgListeners = new Map<string, Set<MessageListener>>()
  private memberListeners = new Map<string, Set<Listener>>()
  private ambientTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    for (const room of SEED_ROOMS) {
      this.rooms.set(room.id, { ...room })
      const members = new Map<string, Member>()
      // seed a few present bots based on online_count
      const present = Math.min(room.online_count, BOTS.length)
      const bots = BOTS.slice(0, present)
      bots.forEach((b, i) =>
        members.set(b.user_id, {
          user_id: b.user_id,
          nickname: b.nickname,
          avatar_seed: b.avatar_seed,
          is_owner: false,
          joined_at: new Date(Date.now() - i * 60_000).toISOString(),
        }),
      )
      this.runtime.set(room.id, {
        members,
        messages: seedMessages(room),
        bots,
      })
    }
  }

  // ---- ambient simulation ----
  private ensureAmbient() {
    if (this.ambientTimer) return
    this.ambientTimer = setInterval(() => this.tick(), 4500)
  }

  private tick() {
    // Only animate rooms that have active listeners to save work.
    for (const [roomId, set] of this.msgListeners) {
      if (set.size === 0) continue
      const room = this.rooms.get(roomId)
      const rt = this.runtime.get(roomId)
      if (!room || !rt || rt.bots.length === 0) continue
      if (Math.random() < 0.6) {
        const bot = rt.bots[Math.floor(Math.random() * rt.bots.length)]
        this.pushMessage({
          id: genId('msg'),
          room_id: roomId,
          user_id: bot.user_id,
          nickname: bot.nickname,
          avatar_seed: bot.avatar_seed,
          content: ambientLine(room.category),
          created_at: new Date().toISOString(),
          kind: 'user',
        })
      }
    }
  }

  // ---- rooms ----
  listRooms(): Room[] {
    return Array.from(this.rooms.values()).map((r) => ({
      ...r,
      online_count: this.runtime.get(r.id)?.members.size ?? r.online_count,
    }))
  }

  getRoom(id: string): Room | null {
    const r = this.rooms.get(id)
    if (!r) return null
    return { ...r, online_count: this.runtime.get(id)?.members.size ?? 0 }
  }

  totalOnline(): number {
    let sum = 0
    for (const rt of this.runtime.values()) sum += rt.members.size
    return sum
  }

  createRoom(input: Omit<Room, 'created_at' | 'updated_at' | 'online_count'>): Room {
    const now = new Date().toISOString()
    const room: Room = { ...input, created_at: now, updated_at: now, online_count: 0 }
    this.rooms.set(room.id, room)
    this.runtime.set(room.id, { members: new Map(), messages: [], bots: [] })
    this.emitRooms()
    return this.getRoom(room.id) as Room
  }

  updateRoom(id: string, patch: Partial<Room>): Room | null {
    const r = this.rooms.get(id)
    if (!r) return null
    const updated = { ...r, ...patch, updated_at: new Date().toISOString() }
    this.rooms.set(id, updated)
    this.emitRooms()
    return this.getRoom(id)
  }

  deleteRoom(id: string) {
    this.rooms.delete(id)
    this.runtime.delete(id)
    this.emitRooms()
  }

  // ---- membership / presence ----
  join(roomId: string, member: Member): { ok: boolean; error?: string } {
    const room = this.rooms.get(roomId)
    const rt = this.runtime.get(roomId)
    if (!room || !rt) return { ok: false, error: 'Room not found.' }
    if (!rt.members.has(member.user_id) && rt.members.size >= room.max_users)
      return { ok: false, error: 'Room is full.' }
    rt.members.set(member.user_id, member)
    this.pushMessage({
      id: genId('sys'),
      room_id: roomId,
      user_id: 'system',
      nickname: 'system',
      avatar_seed: 'system',
      content: `${member.nickname} joined`,
      created_at: new Date().toISOString(),
      kind: 'system',
    })
    this.emitMembers(roomId)
    this.emitRooms()
    this.ensureAmbient()
    return { ok: true }
  }

  leave(roomId: string, userId: string, nickname: string) {
    const rt = this.runtime.get(roomId)
    if (!rt) return
    rt.members.delete(userId)
    this.pushMessage({
      id: genId('sys'),
      room_id: roomId,
      user_id: 'system',
      nickname: 'system',
      avatar_seed: 'system',
      content: `${nickname} left`,
      created_at: new Date().toISOString(),
      kind: 'system',
    })
    this.emitMembers(roomId)
    this.emitRooms()
  }

  kick(roomId: string, userId: string) {
    const rt = this.runtime.get(roomId)
    if (!rt) return
    rt.bots = rt.bots.filter((b) => b.user_id !== userId)
    rt.members.delete(userId)
    this.emitMembers(roomId)
    this.emitRooms()
  }

  listMembers(roomId: string): Member[] {
    const rt = this.runtime.get(roomId)
    if (!rt) return []
    return Array.from(rt.members.values()).sort((a, b) =>
      a.is_owner === b.is_owner
        ? a.nickname.localeCompare(b.nickname)
        : a.is_owner
          ? -1
          : 1,
    )
  }

  // ---- messages ----
  listMessages(roomId: string): Message[] {
    return this.runtime.get(roomId)?.messages ?? []
  }

  pushMessage(msg: Message) {
    const rt = this.runtime.get(msg.room_id)
    if (!rt) return
    rt.messages.push(msg)
    if (rt.messages.length > 200) rt.messages = rt.messages.slice(-200)
    const room = this.rooms.get(msg.room_id)
    if (room) room.updated_at = msg.created_at
    this.msgListeners.get(msg.room_id)?.forEach((cb) => cb(msg))
  }

  // ---- subscriptions ----
  onRooms(cb: Listener): () => void {
    this.roomListeners.add(cb)
    return () => this.roomListeners.delete(cb)
  }
  private emitRooms() {
    this.roomListeners.forEach((cb) => cb())
  }

  onMessages(roomId: string, cb: MessageListener): () => void {
    if (!this.msgListeners.has(roomId)) this.msgListeners.set(roomId, new Set())
    this.msgListeners.get(roomId)!.add(cb)
    this.ensureAmbient()
    return () => {
      this.msgListeners.get(roomId)?.delete(cb)
    }
  }

  onMembers(roomId: string, cb: Listener): () => void {
    if (!this.memberListeners.has(roomId))
      this.memberListeners.set(roomId, new Set())
    this.memberListeners.get(roomId)!.add(cb)
    return () => {
      this.memberListeners.get(roomId)?.delete(cb)
    }
  }
  private emitMembers(roomId: string) {
    this.memberListeners.get(roomId)?.forEach((cb) => cb())
  }
}

// Preserve a single instance across HMR reloads in dev.
const g = globalThis as unknown as { __talkroom_store?: MockStore }
export const mockStore = g.__talkroom_store ?? (g.__talkroom_store = new MockStore())
