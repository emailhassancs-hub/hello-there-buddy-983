import { useState, useCallback } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import HeroSection from "@/components/home/HeroSection";
import WhatsNewCarousel from "@/components/home/WhatsNewCarousel";
import LiveGallery from "@/components/home/LiveGallery";
import WorkflowShowcase from "@/components/home/WorkflowShowcase";
import FooterCTA from "@/components/home/FooterCTA";

const Home = () => {
  const [heroPrompt, setHeroPrompt] = useState("");
  const [pulsePrompt, setPulsePrompt] = useState(false);

  const handleTryPrompt = useCallback((prompt: string) => {
    setHeroPrompt(prompt);
    setPulsePrompt(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setPulsePrompt(false), 800);
  }, []);

  return (
    <SidebarLayout>
      <HeroSection
        promptValue={heroPrompt}
        onPromptChange={setHeroPrompt}
        pulsePrompt={pulsePrompt}
      />
      <WhatsNewCarousel />
      <LiveGallery onTryPrompt={handleTryPrompt} />
      <WorkflowShowcase />
      <FooterCTA />
    </SidebarLayout>
  );
};

export default Home;
