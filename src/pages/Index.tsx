import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { ServiceTiers } from "@/components/ServiceTiers";
import { InspectionRequestForm } from "@/components/InspectionRequestForm";
import { TrustIndicators } from "@/components/TrustIndicators";
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
