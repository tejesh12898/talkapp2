'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wifi, WifiOff, MessageSquare } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { NicknameModal } from '@/components/nickname-modal'
import { RoomHeader } from '@/components/chat/room-header'
import { MessageBubble } from '@/components/chat/message-bubble'
import { MessageInput } from '@/components/chat/message-input'
import { MemberList } from '@/components/chat/member-list'
import { MessageSkeleton } from '@/components/loading-skeleton'
import { EmptyState } from '@/components/empty-state'
import { useChat } from '@/hooks/use-chat'
import { useSession } from '@/hooks/use-session'
import { toggleBlocked } from '@/lib/session'
import { deleteRoom, updateRoom } from '@/lib/backend'
import type { Message } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { session, ready } = useSession()
  const [modalOpen, setModalOpen] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  const { room, messages, members, status, error, send, kick } = useChat({
    roomId: id,
    session,
  })

  // Prompt for nickname if not signed in
  useEffect(() => {
    if (ready && !session) {
      setModalOpen(true)
    }
  }, [ready, session])

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Track if user has scrolled up
  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    autoScrollRef.current = atBottom
  }

  const handleReply = useCallback((msg: Message) => {
    setReplyTo(msg)
  }, [])

  const handleBlock = useCallback((userId: string) => {
    toggleBlocked(userId)
    toast.success('User blocked', { description: 'Their messages are now hidden.' })
  }, [])

  const handleDeleteRoom = useCallback(async () => {
    if (!room) return
    try {
      await deleteRoom(room.id)
      toast.success('Room deleted')
      router.push('/rooms')
    } catch {
      toast.error('Failed to delete room')
    }
  }, [room, router])

  const handleToggleLock = useCallback(async () => {
    if (!room) return
    try {
      await updateRoom(room.id, { is_locked: !room.is_locked })
      toast.success(room.is_locked ? 'Room unlocked' : 'Room locked')
    } catch {
      toast.error('Failed to update room')
    }
  }, [room])

  const isOwner = session && room ? room.owner_id === session.id : false

  // Error state
  if (error && !room) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-4">
          <EmptyState
            icon={WifiOff}
            title="Room not found"
            description={error}
          />
        </main>
      </div>
    )
  }

  // Loading state
  if (!room) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
            <div className="size-8 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-2 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <MessageSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Room Header (replaces Navbar) */}
      <RoomHeader
        room={room}
        memberCount={members.length}
        status={status}
        isOwner={isOwner}
        showMembers={showMembers}
        onToggleMembers={() => setShowMembers((p) => !p)}
        onDeleteRoom={isOwner ? handleDeleteRoom : undefined}
        onToggleLock={isOwner ? handleToggleLock : undefined}
      />

      {/* Main chat area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex flex-1 flex-col">
          {/* Message list */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <MessageSquare className="mx-auto size-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.user_id === session?.id}
                    onReply={handleReply}
                    onBlock={msg.user_id !== session?.id ? handleBlock : undefined}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {session && (
            <MessageInput
              onSend={send}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              disabled={status !== 'connected'}
            />
          )}
        </div>

        {/* Member sidebar */}
        <div
          className={cn(
            'border-l border-border/60 bg-card/50 transition-all duration-300',
            showMembers ? 'w-64' : 'w-0',
            'overflow-hidden',
          )}
        >
          {showMembers && (
            <MemberList
              members={members}
              currentUserId={session?.id ?? ''}
              isOwner={isOwner}
              onKick={isOwner ? kick : undefined}
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* Nickname modal for unauthenticated users */}
      <NicknameModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open && !session) {
            router.push('/rooms')
          }
        }}
      />
    </div>
  )
}
