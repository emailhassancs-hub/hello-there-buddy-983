import SidebarLayout from "@/components/layout/SidebarLayout";
import HeroSection from "@/components/home/HeroSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import CommunitySection from "@/components/home/CommunitySection";

const Home = () => {
  return (
    <SidebarLayout>
      <div
        className="relative"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.035) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Soft radial glow behind hero */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-[600px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 200px, hsl(var(--primary) / 0.07), transparent)",
          }}
        />
        <HeroSection />
        <ProjectsSection />
        <CommunitySection />
      </div>
    </SidebarLayout>
  );
};

export default Home;
