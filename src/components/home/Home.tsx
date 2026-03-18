import SidebarLayout from "@/components/layout/SidebarLayout";
import HeroSection from "@/components/home/HeroSection";
import WhatsNewCarousel from "@/components/home/WhatsNewCarousel";
import AllFeaturesHub from "@/components/home/AllFeaturesHub";
import ModelQuickstart from "@/components/home/ModelQuickstart";
import RecentCreations from "@/components/home/RecentCreations";
import ProjectsSection from "@/components/home/ProjectsSection";

const Home = () => {
  return (
    <SidebarLayout>
      <HeroSection />
      <WhatsNewCarousel />
      <AllFeaturesHub />
      <ModelQuickstart />
      <RecentCreations />
      <ProjectsSection />
    </SidebarLayout>
  );
};

export default Home;
