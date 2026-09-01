'use client'

import { forwardRef } from 'react'
import { Reply, Ban, Flag } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { formatClock } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onReply?: (msg: Message) => void
  onBlock?: (userId: string) => void
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble({ message, isOwn, onReply, onBlock }, ref) {
    // System messages
    if (message.kind === 'system') {
      return (
        <div ref={ref} className="flex justify-center py-1.5">
          <span className="rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
            {message.content}
          </span>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'group flex gap-2.5 px-4 py-1.5 transition-colors hover:bg-muted/30',
          isOwn && 'flex-row-reverse',
        )}
      >
        <UserAvatar
          nickname={message.nickname}
          seed={message.avatar_seed}
          className="size-8 shrink-0 mt-0.5"
        />

        <div className={cn('flex min-w-0 max-w-[75%] flex-col', isOwn && 'items-end')}>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold">{message.nickname}</span>
            <span className="text-[0.65rem] text-muted-foreground">
              {formatClock(message.created_at)}
            </span>
            {message.status === 'sending' && (
              <span className="text-[0.6rem] text-muted-foreground italic">sending…</span>
            )}
            {message.status === 'failed' && (
              <span className="text-[0.6rem] text-destructive italic">failed</span>
            )}
          </div>

          {/* Reply preview */}
          {message.reply_to && (
            <div className="mt-1 flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Reply className="size-3 shrink-0 rotate-180" />
              <span className="font-medium">{message.reply_to.nickname}:</span>
              <span className="truncate">{message.reply_to.content}</span>
            </div>
          )}

          <div
            className={cn(
              'mt-1 rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
              isOwn
                ? 'rounded-tr-md bg-primary text-primary-foreground'
                : 'rounded-tl-md bg-muted/70 text-foreground',
            )}
          >
            {message.content}
          </div>

          {/* Actions — visible on hover */}
          {!isOwn && (
            <div className="mt-0.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Message actions"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </button>
                  }
                />
                <DropdownMenuContent align="start" className="w-40">
                  {onReply && (
                    <DropdownMenuItem onClick={() => onReply(message)}>
                      <Reply className="mr-2 size-3.5" />
                      Reply
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onBlock && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onBlock(message.user_id)}
                    >
                      <Ban className="mr-2 size-3.5" />
                      Block user
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    )
  },
)
