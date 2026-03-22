import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import ImageGenerationTab from "@/components/examples/ImageGenerationTab";
import ThreeDGenerationTab from "@/components/examples/ThreeDGenerationTab";
import ImageEditingTab from "@/components/examples/ImageEditingTab";

const tabs = ["Image Generation", "3D Generation", "Image Editing"] as const;
type Tab = typeof tabs[number];

const ExamplesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("Image Generation");
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <div className="min-h-full">
        {/* Header */}
        <div
          className="text-center px-5 pt-16 pb-12"
          style={{ background: "radial-gradient(ellipse at center, #16101F 0%, transparent 70%)" }}
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.15em] text-primary font-medium border border-primary rounded-full px-3 py-1">
            Gallery
          </span>
          <h1 className="text-3xl md:text-[40px] font-bold text-white mt-4">See what's possible</h1>
          <p className="text-base text-muted-foreground mt-3 max-w-[520px] mx-auto">
            Real outputs from Game AI Studio — generated, edited, and converted to 3D by our pipeline.
          </p>

          {/* Tabs */}
          <div className="inline-flex items-center gap-1 mt-10 bg-card border border-border rounded-xl p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="animate-in fade-in duration-200">
          {activeTab === "Image Generation" && <ImageGenerationTab />}
          {activeTab === "3D Generation" && <ThreeDGenerationTab />}
          {activeTab === "Image Editing" && <ImageEditingTab />}
        </div>

        {/* Footer CTA */}
        <div
          className="text-center px-5 py-20"
          style={{ background: "radial-gradient(ellipse at center, #16101F 0%, transparent 70%)" }}
        >
          <h2 className="text-2xl md:text-[32px] font-bold text-white">
            Ready to build your game assets?
          </h2>
          <p className="text-base text-muted-foreground mt-3">
            Generate images, convert to 3D, and edit — all from one platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => navigate("/image")}
              className="px-7 py-3 bg-primary text-white text-[15px] font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Generate Images →
            </button>
            <button
              onClick={() => navigate("/3d")}
              className="px-7 py-3 border border-border text-foreground text-[15px] font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              Create 3D Models →
            </button>
            <button
              onClick={() => navigate("/edit")}
              className="px-7 py-3 border border-border text-foreground text-[15px] font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              Edit Images →
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ExamplesPage;
