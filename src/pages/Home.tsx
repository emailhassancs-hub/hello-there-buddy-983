import SidebarLayout from "@/components/layout/SidebarLayout";
import HeroSection from "@/components/home/HeroSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import CommunitySection from "@/components/home/CommunitySection";

const Home = () => {
  return (
    <SidebarLayout>
      <HeroSection />
      <ProjectsSection />
      <CommunitySection />
    </SidebarLayout>
  );
};

export default Home;
