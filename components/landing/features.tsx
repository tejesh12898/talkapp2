import { Shuffle, UserX, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant & real-time',
    body: 'Messages land the moment they are sent. No refresh, no lag — just live conversation with everyone in the room.',
  },
  {
    icon: Shuffle,
    title: 'Meet by chance',
    body: 'Hit Random Room or Meet Someone and let the app drop you into an active conversation with people you have never met.',
  },
  {
    icon: UserX,
    title: 'Anonymous by design',
    body: 'No email, no password, no profile to maintain. Pick a nickname, talk, and disappear whenever you want.',
  },
]

export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <h2 className="text-center text-2xl font-semibold tracking-tight">
        Why people use TalkRoom
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="bg-glass">
            <CardHeader>
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </span>
              <CardTitle className="pt-2">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {f.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
