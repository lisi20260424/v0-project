import { AnnouncementBar } from "@/components/announcement-bar"
import { SiteHeaderServer } from "@/components/site-header-server"
import { HeroSection } from "@/components/hero-section"
import { ToolsGridServer } from "@/components/tools-grid-server"
import { VideoGallery } from "@/components/video-gallery"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeaderServer />
      <main className="flex-1">
        <HeroSection />
        <ToolsGridServer />
        <VideoGallery />
        <FeaturesSection />
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  )
}
