'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchMessages,
  fetchRoom,
  joinRoom,
  leaveRoom,
  listMembers,
  sendMessage,
  subscribeMembers,
  subscribeMessages,
  kickMember as backendKick,
} from '@/lib/backend'
import { getBlocked } from '@/lib/session'
import { genId } from '@/lib/session'
import { validateMessage } from '@/lib/validation'
import type { ConnectionStatus, Member, Message, Room } from '@/lib/types'
import type { Session } from '@/lib/types'

interface UseChatOptions {
  roomId: string
  session: Session | null
}

export function useChat({ roomId, session }: UseChatOptions) {
  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const joinedRef = useRef(false)
  const blockedRef = useRef<string[]>([])

  // Keep blocked list in sync
  useEffect(() => {
    blockedRef.current = getBlocked()
    const sync = () => {
      blockedRef.current = getBlocked()
      // Re-filter messages when block list changes
      setMessages((prev) => prev.filter((m) => !blockedRef.current.includes(m.user_id)))
    }
    window.addEventListener('talkroom:blocked', sync)
    return () => window.removeEventListener('talkroom:blocked', sync)
  }, [])

  // Load room, messages, join, subscribe
  useEffect(() => {
    if (!session) return
    let active = true

    async function init() {
      try {
        const r = await fetchRoom(roomId)
        if (!active) return
        if (!r) {
          setError('Room not found.')
          setStatus('connected')
          return
        }
        setRoom(r)

        const msgs = await fetchMessages(roomId)
        if (!active) return
        const blocked = blockedRef.current
        setMessages(msgs.filter((m) => !blocked.includes(m.user_id)))

        // Join room
        if (!joinedRef.current) {
          const result = joinRoom(roomId, {
            user_id: session.id,
            nickname: session.nickname,
            avatar_seed: session.avatar_seed,
            is_owner: r.owner_id === session.id,
            joined_at: new Date().toISOString(),
          })
          if (!result.ok) {
            setError(result.error ?? 'Could not join room.')
            setStatus('connected')
            return
          }
          joinedRef.current = true
        }

        setMembers(listMembers(roomId))
        setStatus('connected')
      } catch {
        if (active) {
          setError('Failed to load room.')
          setStatus('connected')
        }
      }
    }

    init()

    // Subscribe to new messages
    const unsubMsg = subscribeMessages(
      roomId,
      (msg) => {
        if (blockedRef.current.includes(msg.user_id)) return
        setMessages((prev) => {
          // Deduplicate (optimistic message may already exist)
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      },
      (connected) => {
        setStatus(connected ? 'connected' : 'reconnecting')
      },
    )

    // Subscribe to member changes
    const unsubMembers = subscribeMembers(roomId, () => {
      setMembers(listMembers(roomId))
      // Refresh room data for online count
      fetchRoom(roomId).then((r) => {
        if (r && active) setRoom(r)
      })
    })

    return () => {
      active = false
      unsubMsg()
      unsubMembers()
      if (joinedRef.current && session) {
        leaveRoom(roomId, session.id, session.nickname)
        joinedRef.current = false
      }
    }
  }, [roomId, session])

  // Send message
  const send = useCallback(
    async (content: string, replyTo?: { nickname: string; content: string } | null) => {
      if (!session) return
      const validation = validateMessage(content)
      if (!validation.ok) return

      const msg: Message = {
        id: genId('msg'),
        room_id: roomId,
        user_id: session.id,
        nickname: session.nickname,
        avatar_seed: session.avatar_seed,
        content: validation.value,
        created_at: new Date().toISOString(),
        kind: 'user',
        reply_to: replyTo ?? null,
        status: 'sending',
      }

      // Optimistic add
      setMessages((prev) => [...prev, msg])

      try {
        await sendMessage(msg)
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'sent' as const } : m)),
        )
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' as const } : m)),
        )
      }
    },
    [roomId, session],
  )

  // Kick member
  const kick = useCallback(
    (userId: string) => {
      backendKick(roomId, userId)
      setMembers(listMembers(roomId))
    },
    [roomId],
  )

  return { room, messages, members, status, error, send, kick }
}
