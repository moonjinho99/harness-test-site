import { CategorySection } from "@/components/landing/CategorySection"
import { FeaturedProducts } from "@/components/landing/FeaturedProducts"
import { Footer } from "@/components/landing/Footer"
import { Header } from "@/components/landing/Header"
import { HeroSection } from "@/components/landing/HeroSection"
import { PromoBanner } from "@/components/landing/PromoBanner"
import { TrustSection } from "@/components/landing/TrustSection"

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <CategorySection />
        <FeaturedProducts />
        <PromoBanner />
        <TrustSection />
      </main>
      <Footer />
    </>
  )
}