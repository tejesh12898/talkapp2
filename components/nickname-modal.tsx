'use client'

import { useEffect, useState } from 'react'
import { Shuffle, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { UserAvatar } from '@/components/user-avatar'
import { suggestNickname } from '@/lib/avatar'
import { NICKNAME_MAX, validateNickname } from '@/lib/validation'
import { useSession } from '@/hooks/use-session'

interface NicknameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Called once a valid nickname is set. Receives the chosen nickname.
  onComplete?: (nickname: string) => void
  mode?: 'signin' | 'rename'
}

export function NicknameModal({
  open,
  onOpenChange,
  onComplete,
  mode = 'signin',
}: NicknameModalProps) {
  const { session, signIn, rename } = useSession()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [seed, setSeed] = useState('preview')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const initial = mode === 'rename' ? (session?.nickname ?? '') : ''
      setValue(initial)
      setSeed(session?.avatar_seed ?? 'preview')
      setError(null)
      setIsSubmitting(false)
    }
  }, [open, mode, session])

  async function submit() {
    const result = validateNickname(value)
    if (!result.ok) {
      setError(result.error ?? 'Invalid nickname.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      if (mode === 'rename') {
        await rename(result.value)
      } else {
        await signIn(result.value)
      }
      onComplete?.(result.value)
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save nickname.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'rename' ? 'Change your nickname' : 'Pick a nickname'}
          </DialogTitle>
          <DialogDescription>
            No account needed. Choose a nickname to join live rooms and chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <UserAvatar
            nickname={value || 'You'}
            seed={seed}
            className="size-14 text-lg"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{value || 'Your name here'}</p>
            <p className="text-xs text-muted-foreground">Your generated avatar</p>
          </div>
        </div>

        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="nickname">Nickname</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="nickname"
              autoFocus
              value={value}
              maxLength={NICKNAME_MAX}
              placeholder="e.g. NeonFox42"
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  submit()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Suggest a random nickname"
              onClick={() => {
                setValue(suggestNickname())
                setError(null)
              }}
            >
              <Shuffle />
            </Button>
          </div>
          <FieldDescription>
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              `${value.length}/${NICKNAME_MAX} characters`
            )}
          </FieldDescription>
        </Field>

        <Button onClick={submit} className="w-full" disabled={isSubmitting}>
          <Sparkles data-icon="inline-start" />
          {isSubmitting
            ? 'Saving...'
            : mode === 'rename'
              ? 'Save nickname'
              : 'Start chatting'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
