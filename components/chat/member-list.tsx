'use client'

import { Crown, UserMinus, VolumeX, Flag } from 'lucide-react'
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
  onMute?: (userId: string) => void
  onReport?: (member: Member) => void
  className?: string
}

export function MemberList({
  members,
  currentUserId,
  isOwner,
  onKick,
  onMute,
  onReport,
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
                  'group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors',
                  isSelf && 'bg-accent/40',
                  !isSelf && 'hover:bg-muted/40',
                )}
              >
                <UserAvatar
                  nickname={m.nickname}
                  seed={m.avatar_seed}
                  className="size-8 shrink-0"
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

                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {isOwner && !isSelf && !m.is_owner && onMute && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => onMute(m.user_id)}
                            aria-label={`Mute ${m.nickname}`}
                          >
                            <VolumeX className="size-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Mute in room</TooltipContent>
                    </Tooltip>
                  )}

                  {isOwner && !isSelf && !m.is_owner && onKick && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/10"
                            onClick={() => onKick(m.user_id)}
                            aria-label={`Kick ${m.nickname}`}
                          >
                            <UserMinus className="size-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Kick from room</TooltipContent>
                    </Tooltip>
                  )}

                  {!isSelf && onReport && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => onReport(m)}
                            aria-label={`Report ${m.nickname}`}
                          >
                            <Flag className="size-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Report user</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </ScrollArea>
    </div>
  )
}
