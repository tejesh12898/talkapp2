'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NicknameModal } from '@/components/nickname-modal'
import { useSession } from '@/hooks/use-session'

export function FinalCta() {
  const router = useRouter()
  const { session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-glass px-6 py-14 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-40 bg-brand-gradient"
          aria-hidden="true"
          style={{ maskImage: 'radial-gradient(circle at 50% 0%, black, transparent 70%)' }}
        />
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Someone out there is ready to talk.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-balance text-muted-foreground">
          Jump into a room and start a conversation in seconds.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-11 px-5 text-base"
            onClick={() => (session ? router.push('/rooms') : setOpen(true))}
          >
            <Sparkles data-icon="inline-start" />
            Start Chatting
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-5 text-base"
            render={<Link href="/rooms" />}
          >
            Explore rooms
          </Button>
        </div>
      </div>

      <NicknameModal
        open={open}
        onOpenChange={setOpen}
        onComplete={() => router.push('/rooms')}
      />
    </section>
  )
}
