'use client'

import { useMemo, useState } from 'react'
import { Search, Sparkles, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { RoomGrid } from '@/components/room-grid'
import { RoomGridSkeleton } from '@/components/loading-skeleton'
import { EmptyState } from '@/components/empty-state'
import { NicknameModal } from '@/components/nickname-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRooms } from '@/hooks/use-rooms'
import { useSession } from '@/hooks/use-session'
import { CATEGORIES, type Category, type RoomFilter } from '@/lib/types'
import { cn } from '@/lib/utils'

const FILTERS: RoomFilter[] = ['All', 'Popular', 'New', 'Almost Full']

export default function RoomsPage() {
  const { rooms, online, error, loading } = useRooms()
  const { session } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'All' | Category>('All')
  const [filter, setFilter] = useState<RoomFilter>('All')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!rooms) return []
    let list = [...rooms]

    // Category filter
    if (category !== 'All') {
      list = list.filter((r) => r.category === category)
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q),
      )
    }

    // Quick filters
    switch (filter) {
      case 'Popular':
        list.sort((a, b) => b.online_count - a.online_count)
        break
      case 'New':
        list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        break
      case 'Almost Full':
        list = list
          .filter((r) => r.online_count >= r.max_users * 0.6)
          .sort((a, b) => b.online_count / b.max_users - a.online_count / a.max_users)
        break
      default:
        list.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
    }

    return list
  }, [rooms, search, category, filter])

  function handleCreateClick() {
    if (session) {
      router.push('/rooms/create')
    } else {
      setModalOpen(true)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Rooms</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? 'Loading rooms…'
                  : `${rooms?.length ?? 0} rooms · ${online.toLocaleString()} people online`}
              </p>
            </div>
            <Button onClick={handleCreateClick} className="shrink-0">
              <Plus data-icon="inline-start" />
              Create Room
            </Button>
          </div>

          {/* Search + Filters */}
          <div className="mt-6 space-y-4">
            {/* Search bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms…"
                className="pl-9"
              />
            </div>

            {/* Quick filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    filter === f
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {f}
                </button>
              ))}

              <span className="mx-2 h-4 w-px bg-border" />

              {/* Category tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setCategory('All')}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs transition-colors',
                    category === 'All'
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  All
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs transition-colors',
                      category === c
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Room grid */}
          <div className="mt-6">
            {loading ? (
              <RoomGridSkeleton count={6} />
            ) : error ? (
              <EmptyState
                icon={Sparkles}
                title="Something went wrong"
                description={error}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No rooms found"
                description={
                  search || category !== 'All'
                    ? 'Try adjusting your search or filters.'
                    : 'Be the first to create a room!'
                }
              >
                <Button onClick={handleCreateClick}>
                  <Plus data-icon="inline-start" />
                  Create Room
                </Button>
              </EmptyState>
            ) : (
              <RoomGrid rooms={filtered} />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />

      <NicknameModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onComplete={() => router.push('/rooms/create')}
      />
    </div>
  )
}
