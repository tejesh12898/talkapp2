'use client'

import Link from 'next/link'
import { Lock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { BOTS } from '@/lib/mock-data'
import { relativeTime } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { Room } from '@/lib/types'

function AvatarStack({ room }: { room: Room }) {
  const count = Math.min(room.online_count, 4)
  const seeds = BOTS.slice(0, count)
  if (count === 0) return null
  return (
    <div className="flex -space-x-2">
      {seeds.map((b) => (
        <UserAvatar
          key={b.user_id}
          nickname={b.nickname}
          seed={b.avatar_seed}
          className="size-6 text-[0.55rem] rounded-full ring-2 ring-card"
        />
      ))}
      {room.online_count > 4 && (
        <span className="grid size-6 place-items-center rounded-full bg-muted text-[0.6rem] font-medium text-muted-foreground ring-2 ring-card">
          +{room.online_count - 4}
        </span>
      )}
    </div>
  )
}

export function RoomCard({ room }: { room: Room }) {
  const full = room.online_count >= room.max_users
  const active = room.online_count > 0
  const href = room.is_private && room.invite_code
    ? `/room/${room.id}?invite=${room.invite_code}`
    : `/room/${room.id}`

  return (
    <Card className="group relative gap-0 overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
      <CardHeader className="gap-0">
        <div className="flex items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-sm font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {room.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold leading-tight">{room.name}</h3>
              {room.is_private && (
                <Lock className="size-3.5 shrink-0 text-muted-foreground" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {room.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {relativeTime(room.created_at)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
          {room.description || 'No description provided.'}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AvatarStack room={room} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  active ? 'bg-online animate-pulse-ring' : 'bg-muted-foreground',
                )}
              />
              <Users className="size-3.5" />
              {room.online_count}/{room.max_users}
            </span>
          </div>

          {full ? (
            <Button variant="secondary" size="sm" disabled>
              Room is full
            </Button>
          ) : (
            <Button size="sm" render={<Link href={href} />}>
              Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
