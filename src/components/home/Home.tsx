import SidebarLayout from "@/components/home/SidebarLayout";
import HeroSection from "@/components/home/HeroSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import CommunitySection from "@/components/home/CommunitySection";
import { useNotifications } from "@/hooks/use-notifications";
const Home = () => {
  // Fetch notifications as soon as /home renders
  useNotifications(true);
  return (
    <SidebarLayout>
      <HeroSection />
      <ProjectsSection />
      {/* <CommunitySection /> */}
    </SidebarLayout>
  );
};
export default Home;