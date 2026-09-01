import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/landing/hero'
import { PopularRooms } from '@/components/landing/popular-rooms'
import { Features } from '@/components/landing/features'
import { FinalCta } from '@/components/landing/final-cta'

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PopularRooms />
        <Features />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
