'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NicknameModal } from '@/components/nickname-modal'
import { useSession } from '@/hooks/use-session'
import { useRooms } from '@/hooks/use-rooms'

export function Hero() {
  const router = useRouter()
  const { session } = useSession()
  const { online, loading } = useRooms()
  const [modalOpen, setModalOpen] = useState(false)

  function startChatting() {
    if (session) {
      router.push('/rooms')
    } else {
      setModalOpen(true)
    }
  }

  return (
    <section className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-20 pb-16 text-center sm:pt-28">
      <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-border/70 bg-glass px-3 py-1 text-xs text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-online opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-online" />
        </span>
        {loading ? 'Connecting…' : `${online.toLocaleString()} people online right now`}
      </div>

      <h1 className="animate-fade-in-up mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
        Talk to <span className="text-gradient-brand">someone new.</span>
      </h1>

      <p className="animate-fade-in-up mt-5 max-w-xl text-balance text-lg text-muted-foreground">
        Join a room, meet random people, and start talking. No sign-up, no email —
        just pick a nickname and jump in.
      </p>

      <div className="animate-fade-in-up mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button size="lg" className="h-11 px-5 text-base" onClick={startChatting}>
          <Sparkles data-icon="inline-start" />
          Start Chatting
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-11 px-5 text-base"
          render={<Link href="/rooms/create" />}
        >
          <Plus data-icon="inline-start" />
          Create a Room
        </Button>
      </div>

      <Button
        variant="link"
        className="mt-4 text-muted-foreground"
        render={<Link href="/rooms" />}
      >
        Browse all rooms
        <ArrowRight data-icon="inline-end" />
      </Button>

      <NicknameModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onComplete={() => router.push('/rooms')}
      />
    </section>
  )
}
