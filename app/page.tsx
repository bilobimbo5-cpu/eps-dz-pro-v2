import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import AiHighlight from "@/components/landing/AiHighlight";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LandingHeader />
      <Hero />
      <Features />
      <HowItWorks />
      <AiHighlight />
      <Pricing />
      <Faq />
      <LandingFooter />
    </div>
  );
}
