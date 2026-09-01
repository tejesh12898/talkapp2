'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { MessagesSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserAvatar } from '@/components/user-avatar'
import { NicknameModal } from '@/components/nickname-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { session, ready } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  const links = [
    { href: '/rooms', label: 'Rooms' },
    { href: '/rooms/create', label: 'Create' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-glass">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-gradient text-primary-foreground">
            <MessagesSquare className="size-4" />
          </span>
          <span>TalkRoom</span>
        </Link>

        <div className="ml-4 hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Button
              key={l.href}
              variant="ghost"
              size="sm"
              render={<Link href={l.href} />}
              className={cn(
                'text-muted-foreground',
                pathname === l.href && 'text-foreground',
              )}
            >
              {l.label}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {ready && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="gap-2 pl-1">
                    <UserAvatar
                      nickname={session.nickname}
                      seed={session.avatar_seed}
                      className="size-6 text-[0.6rem]"
                    />
                    <span className="hidden max-w-28 truncate sm:inline">
                      {session.nickname}
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    Change nickname
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/rooms')}>
                    Browse rooms
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/rooms/create')}>
                    Create a room
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus data-icon="inline-start" />
              Start chatting
            </Button>
          )}
        </div>
      </nav>

      <NicknameModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onComplete={() => router.push('/rooms')}
      />
      <NicknameModal open={renameOpen} onOpenChange={setRenameOpen} mode="rename" />
    </header>
  )
}
