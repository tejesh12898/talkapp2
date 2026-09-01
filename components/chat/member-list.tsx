'use client'

import { Crown, UserMinus } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Member } from '@/lib/types'

interface MemberListProps {
  members: Member[]
  currentUserId: string
  isOwner: boolean
  onKick?: (userId: string) => void
  className?: string
}

export function MemberList({
  members,
  currentUserId,
  isOwner,
  onKick,
  className,
}: MemberListProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="text-sm font-semibold">
          Members
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            ({members.length})
          </span>
        </h3>
        <span className="flex items-center gap-1 text-xs text-online">
          <span className="size-1.5 rounded-full bg-online animate-pulse-ring" />
          Online
        </span>
      </div>
      <ScrollArea className="flex-1 px-2 py-2">
        <ul className="space-y-0.5">
          {members.map((m) => {
            const isSelf = m.user_id === currentUserId
            return (
              <li
                key={m.user_id}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors',
                  isSelf && 'bg-accent/40',
                  !isSelf && 'hover:bg-muted/40',
                )}
              >
                <UserAvatar
                  nickname={m.nickname}
                  seed={m.avatar_seed}
                  className="size-8"
                  online
                  showStatus
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                    <span className="truncate">{m.nickname}</span>
                    {isSelf && (
                      <span className="text-[0.6rem] text-muted-foreground">(you)</span>
                    )}
                  </span>
                  {m.is_owner && (
                    <span className="flex items-center gap-0.5 text-[0.65rem] text-amber-500">
                      <Crown className="size-2.5" />
                      Owner
                    </span>
                  )}
                </div>
                {isOwner && !isSelf && !m.is_owner && onKick && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => onKick(m.user_id)}
                          aria-label={`Kick ${m.nickname}`}
                        >
                          <UserMinus className="size-3.5 text-destructive" />
                        </Button>
                      }
                    />
                    <TooltipContent>Kick from room</TooltipContent>
                  </Tooltip>
                )}
              </li>
            )
          })}
        </ul>
      </ScrollArea>
    </div>
  )
}
