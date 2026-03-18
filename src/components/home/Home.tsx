import SidebarLayout from "@/components/layout/SidebarLayout";
import HeroSection from "@/components/home/HeroSection";
import FeatureDiscoveryStrip from "@/components/home/FeatureDiscoveryStrip";
import WorkflowShowcase from "@/components/home/WorkflowShowcase";
import RecentCreations from "@/components/home/RecentCreations";
import PromptBar from "@/components/home/PromptBar";

const Home = () => {
  return (
    <SidebarLayout>
      <div className="pb-[160px]">
        <HeroSection />
        <FeatureDiscoveryStrip />
        <WorkflowShowcase />
        <RecentCreations />
      </div>
      <PromptBar />
    </SidebarLayout>
  );
};

export default Home;
