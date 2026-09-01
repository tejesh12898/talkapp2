'use client'

import { useRef, useState } from 'react'
import { Send, X, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MESSAGE_MAX } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

interface MessageInputProps {
  onSend: (content: string, replyTo?: { nickname: string; content: string } | null) => void
  replyTo: Message | null
  onCancelReply: () => void
  disabled?: boolean
}

export function MessageInput({ onSend, replyTo, onCancelReply, disabled }: MessageInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(
      trimmed,
      replyTo ? { nickname: replyTo.nickname, content: replyTo.content } : null,
    )
    setValue('')
    onCancelReply()
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const charCount = value.length
  const overLimit = charCount > MESSAGE_MAX

  return (
    <div className="border-t border-border/60 bg-card/80 backdrop-blur-sm">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2 text-xs text-muted-foreground">
          <Reply className="size-3.5 shrink-0 rotate-180 text-primary" />
          <span className="font-medium text-foreground">Replying to {replyTo.nickname}</span>
          <span className="truncate">{replyTo.content}</span>
          <button
            onClick={onCancelReply}
            className="ml-auto shrink-0 rounded p-0.5 hover:bg-muted"
            aria-label="Cancel reply"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            disabled={disabled}
            maxLength={MESSAGE_MAX + 50}
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-2.5 pr-12 text-sm',
              'placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-32 min-h-[2.5rem]',
              overLimit && 'border-destructive focus:border-destructive focus:ring-destructive/30',
            )}
            style={{
              height: 'auto',
              minHeight: '2.5rem',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 128) + 'px'
            }}
          />
          <span
            className={cn(
              'absolute right-3 bottom-2 text-[0.6rem] tabular-nums',
              overLimit ? 'text-destructive' : 'text-muted-foreground/50',
            )}
          >
            {charCount > MESSAGE_MAX * 0.8 ? `${charCount}/${MESSAGE_MAX}` : ''}
          </span>
        </div>

        <Button
          size="icon"
          className="size-10 shrink-0 rounded-xl"
          onClick={handleSend}
          disabled={disabled || !value.trim() || overLimit}
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
