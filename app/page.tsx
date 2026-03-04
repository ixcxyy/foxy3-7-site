import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { BandSection } from "@/components/band-section"
import { EventsSection } from "@/components/events-section"
import { GallerySection } from "@/components/gallery-section"
import { LyricsSection } from "@/components/lyrics-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#0a0a0a", color: "#f0f0f0" }}>
      <Navigation />
      <HeroSection />
      <BandSection />
      <EventsSection />
      <GallerySection />
      <LyricsSection />
      <Footer />
    </main>
  )
}
