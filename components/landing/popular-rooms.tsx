'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomGrid } from '@/components/room-grid'
import { RoomGridSkeleton } from '@/components/loading-skeleton'
import { useRooms } from '@/hooks/use-rooms'

export function PopularRooms() {
  const { rooms, loading } = useRooms()

  const popular = (rooms ?? [])
    .slice()
    .sort((a, b) => b.online_count - a.online_count)
    .slice(0, 6)

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Popular right now</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The rooms where the conversation is happening.
          </p>
        </div>
        <Button variant="ghost" size="sm" render={<Link href="/rooms" />}>
          See all
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      {loading ? <RoomGridSkeleton /> : <RoomGrid rooms={popular} />}
    </section>
  )
}
