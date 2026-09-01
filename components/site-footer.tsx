import Link from 'next/link'
import { MessagesSquare } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="grid size-6 place-items-center rounded-md bg-brand-gradient text-primary-foreground">
            <MessagesSquare className="size-3.5" />
          </span>
          TalkRoom
        </div>
        <p className="text-xs text-muted-foreground">
          Anonymous, real-time chat. Be kind to strangers.
        </p>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/rooms" className="hover:text-foreground">
            Rooms
          </Link>
          <Link href="/rooms/create" className="hover:text-foreground">
            Create
          </Link>
        </nav>
      </div>
    </footer>
  )
}
