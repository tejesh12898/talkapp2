// Shared domain types. These mirror the Supabase schema so the mock
// data layer can be swapped for real queries without touching the UI.

export const CATEGORIES = [
  'General',
  'Gaming',
  'Music',
  'Movies',
  'Sports',
  'Technology',
  'College',
  'Relationships',
  'Memes',
  'Random',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Hate speech',
  'Sexual content',
  'Threats',
  'Other',
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

// Row: sessions
export interface Session {
  id: string
  nickname: string
  avatar_seed: string
  created_at: string
  last_seen: string
}

// Row: rooms
export interface Room {
  id: string
  name: string
  description: string
  category: Category
  owner_id: string
  max_users: number
  is_private: boolean
  invite_code: string | null
  is_discoverable: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  // Derived / presence-backed (not stored)
  online_count: number
}

// Row: messages
export interface Message {
  id: string
  room_id: string
  user_id: string
  nickname: string
  avatar_seed: string
  content: string
  created_at: string
  // Client-only
  kind?: 'user' | 'system'
  reply_to?: { nickname: string; content: string } | null
  status?: 'sending' | 'sent' | 'failed'
}

// Row: reports
export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string | null
  message_id: string | null
  room_id: string
  reason: ReportReason
  description: string
  created_at: string
}

// Presence-backed member
export interface Member {
  user_id: string
  nickname: string
  avatar_seed: string
  is_owner: boolean
  joined_at: string
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting'

export type RoomFilter = 'All' | 'Popular' | 'New' | 'Almost Full'
