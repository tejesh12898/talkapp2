'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchMessages,
  fetchRoom,
  sendMessage,
  subscribeMessages,
  subscribePresence,
  kickMember as backendKick,
  muteMember,
} from '@/lib/backend'
import { getBlocked } from '@/lib/session'
import { genId } from '@/lib/session'
import { validateMessage } from '@/lib/validation'
import { toast } from 'sonner'
import type { ConnectionStatus, Member, Message, Room } from '@/lib/types'
import type { Session } from '@/lib/types'

interface UseChatOptions {
  roomId: string
  session: Session | null
  inviteCode?: string | null
}

export function useChat({ roomId, session, inviteCode }: UseChatOptions) {
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
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

  // Load room, messages, join presence, subscribe realtime
  useEffect(() => {
    if (!session) return
    let active = true

    const currentMember: Member = {
      user_id: session.id,
      nickname: session.nickname,
      avatar_seed: session.avatar_seed || session.id,
      is_owner: false,
      joined_at: new Date().toISOString(),
    }

    async function init() {
      try {
        const r = await fetchRoom(roomId, inviteCode ?? undefined)
        if (!active) return
        if (!r) {
          setError('Room not found or invalid invite code.')
          setStatus('connected')
          return
        }
        setRoom(r)
        currentMember.is_owner = r.owner_id === session?.id

        const msgs = await fetchMessages(roomId)
        if (!active) return
        const blocked = blockedRef.current
        setMessages(msgs.filter((m) => !blocked.includes(m.user_id)))
        setStatus('connected')
      } catch {
        if (active) {
          setError('Failed to load room.')
          setStatus('connected')
        }
      }
    }

    init()

    let wasDisconnected = false

    // Subscribe to new messages
    const unsubMsg = subscribeMessages(
      roomId,
      (msg) => {
        if (!active) return
        if (blockedRef.current.includes(msg.user_id)) return
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === msg.id)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], ...msg, status: 'sent' as const }
            return updated
          }
          return [...prev, { ...msg, status: 'sent' as const }]
        })
      },
      (connected) => {
        if (!active) return
        if (connected) {
          setStatus('connected')
          if (wasDisconnected) {
            wasDisconnected = false
            // Backfill missed messages after reconnecting
            fetchMessages(roomId)
              .then((latest) => {
                if (!active) return
                const blocked = blockedRef.current
                const filtered = latest.filter((m) => !blocked.includes(m.user_id))
                setMessages((prev) => {
                  const existingIds = new Set(prev.map((m) => m.id))
                  const newOnes = filtered.filter((m) => !existingIds.has(m.id))
                  if (newOnes.length === 0) return prev
                  return [...prev, ...newOnes].sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                  )
                })
              })
              .catch(() => {})
          }
        } else {
          wasDisconnected = true
          setStatus('reconnecting')
        }
      },
      (deletedId) => {
        if (!active) return
        setMessages((prev) => prev.filter((m) => m.id !== deletedId))
      },
    )

    // Presence subscription
    let initialPresenceSynced = false

    const unsubPresence = subscribePresence(roomId, currentMember, {
      onSync: (liveMembers) => {
        if (!active) return
        setMembers(liveMembers)
        setRoom((prev) => (prev ? { ...prev, online_count: liveMembers.length } : null))
        initialPresenceSynced = true
      },
      onJoin: (member) => {
        if (!active || !initialPresenceSynced) return
        if (member.user_id === session.id) return
        // System message for member join
        setMessages((prev) => [
          ...prev,
          {
            id: genId('msg_sys'),
            room_id: roomId,
            user_id: member.user_id,
            nickname: member.nickname,
            avatar_seed: member.avatar_seed,
            content: `${member.nickname} joined the room`,
            created_at: new Date().toISOString(),
            kind: 'system',
            status: 'sent',
          },
        ])
      },
      onLeave: (member) => {
        if (!active || !initialPresenceSynced) return
        if (member.user_id === session.id) return
        // System message for member leave
        setMessages((prev) => [
          ...prev,
          {
            id: genId('msg_sys'),
            room_id: roomId,
            user_id: member.user_id,
            nickname: member.nickname,
            avatar_seed: member.avatar_seed,
            content: `${member.nickname} left the room`,
            created_at: new Date().toISOString(),
            kind: 'system',
            status: 'sent',
          },
        ])
      },
      onKick: (kickedUserId) => {
        if (!active) return
        if (kickedUserId === session.id) {
          toast.error('You were kicked from the room by the owner.')
          router.push('/rooms')
        } else {
          setMembers((prev) => prev.filter((m) => m.user_id !== kickedUserId))
        }
      },
      onMute: (mutedUserId) => {
        if (!active) return
        if (mutedUserId === session.id) {
          setIsMuted(true)
          toast.error('You have been muted in this room by the owner.')
        }
      },
    })

    return () => {
      active = false
      unsubMsg()
      unsubPresence()
    }
  }, [roomId, session, inviteCode, router])

  // Send message
  const send = useCallback(
    async (content: string, replyTo?: { nickname: string; content: string } | null) => {
      if (!session) return
      if (isMuted) {
        toast.error('You are muted in this room.')
        return
      }
      const validation = validateMessage(content)
      if (!validation.ok) return

      const msg: Message = {
        id: genId('msg'),
        room_id: roomId,
        user_id: session.id,
        nickname: session.nickname,
        avatar_seed: session.avatar_seed || session.id,
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
      } catch (err: unknown) {
        const errMsg = (err as { message?: string })?.message || ''
        if (errMsg.includes("You're sending messages too fast")) {
          toast.error("You're sending messages too fast. Please slow down.")
        } else {
          toast.error('Failed to send message.')
        }
        console.error('Send message failed:', err)
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' as const } : m)),
        )
      }
    },
    [roomId, session, isMuted],
  )

  // Kick member
  const kick = useCallback(
    (userId: string) => {
      backendKick(roomId, userId)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    },
    [roomId],
  )

  // Mute member
  const mute = useCallback(
    (userId: string) => {
      muteMember(roomId, userId)
      toast.success('User muted')
    },
    [roomId],
  )

  return { room, messages, members, status, error, send, kick, mute, isMuted }
}
