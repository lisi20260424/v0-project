import { AnnouncementBar } from "@/components/announcement-bar"
import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { ToolsGrid } from "@/components/tools-grid"
import { VideoGallery } from "@/components/video-gallery"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <ToolsGrid />
        <VideoGallery />
        <FeaturesSection />
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  )
}
