'use client'

import Link from 'next/link'
import { ArrowLeft, Users, Hash, Settings, Trash2, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ConnectionStatus, Room } from '@/lib/types'

interface RoomHeaderProps {
  room: Room
  memberCount: number
  status: ConnectionStatus
  isOwner: boolean
  showMembers: boolean
  onToggleMembers: () => void
  onDeleteRoom?: () => void
  onToggleLock?: () => void
}

export function RoomHeader({
  room,
  memberCount,
  status,
  isOwner,
  showMembers,
  onToggleMembers,
  onDeleteRoom,
  onToggleLock,
}: RoomHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        render={<Link href="/rooms" />}
        aria-label="Back to rooms"
      >
        <ArrowLeft className="size-4" />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold">{room.name}</h1>
          {room.is_private && <Lock className="size-3 shrink-0 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="h-4 px-1.5 text-[0.6rem] font-normal">
            {room.category}
          </Badge>
          <span className="flex items-center gap-1">
            <span
              className={cn(
                'size-1.5 rounded-full',
                status === 'connected'
                  ? 'bg-online'
                  : status === 'reconnecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-muted-foreground animate-pulse',
              )}
            />
            {status === 'connected'
              ? `${memberCount} online`
              : status === 'reconnecting'
                ? 'Reconnecting…'
                : 'Connecting…'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant={showMembers ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={onToggleMembers}
          aria-label={showMembers ? 'Hide members' : 'Show members'}
        >
          <Users className="size-4" />
        </Button>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8" aria-label="Room settings">
                  <Settings className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              {onToggleLock && (
                <DropdownMenuItem onClick={onToggleLock}>
                  {room.is_locked ? (
                    <>
                      <Unlock className="mr-2 size-3.5" />
                      Unlock room
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 size-3.5" />
                      Lock room
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDeleteRoom && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDeleteRoom}
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete room
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
