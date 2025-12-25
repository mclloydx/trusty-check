import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { ServiceTiers } from "@/components/ServiceTiers";
import { InspectionRequestForm } from "@/components/InspectionRequestForm";
import { TrustIndicators } from "@/components/TrustIndicators";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <TrustIndicators />
        <HowItWorks />
        <ServiceTiers />
        <InspectionRequestForm />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
