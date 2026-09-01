'use client'

import { cn } from '@/lib/utils'
import { avatarStyle, initials } from '@/lib/avatar'

interface UserAvatarProps {
  nickname: string
  seed: string
  className?: string
  online?: boolean
  showStatus?: boolean
}

// Deterministic gradient + initials avatar. No network, no uploads —
// identical seed always yields the same visual.
export function UserAvatar({
  nickname,
  seed,
  className,
  online,
  showStatus = false,
}: UserAvatarProps) {
  const style = avatarStyle(seed)
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        aria-hidden="true"
        className="grid size-full place-items-center rounded-full text-[0.7em] font-semibold text-white select-none"
        style={{
          backgroundImage: `linear-gradient(135deg, ${style.from}, ${style.to})`,
        }}
      >
        {initials(nickname)}
      </span>
      {showStatus && (
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card',
            online ? 'bg-online' : 'bg-muted-foreground',
          )}
        />
      )}
      <span className="sr-only">{nickname}</span>
    </span>
  )
}
