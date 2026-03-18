import { useState } from "react";
import { Image } from "lucide-react";

const tabs = ["History", "Community", "Tutorial"] as const;

const RecentCreations = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("History");

  return (
    <section className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Creations</h2>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state for History */}
        {activeTab === "History" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base text-foreground font-medium mb-1">Your creations will appear here</p>
            <p className="text-sm text-muted-foreground">Start by typing a prompt below</p>
          </div>
        )}

        {/* Community tab */}
        {activeTab === "Community" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted shimmer-card" />
            ))}
          </div>
        )}

        {/* Tutorial tab */}
        {activeTab === "Tutorial" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Write a prompt", desc: "Describe what you want to create" },
              { step: 2, title: "Choose a model", desc: "Pick the best model for your use case" },
              { step: 3, title: "Click Create", desc: "Generate your image or 3D model" },
              { step: 4, title: "Explore editing", desc: "Edit, upscale, and refine your output" },
            ].map((item) => (
              <div key={item.step} className="p-4 rounded-xl border border-border bg-card">
                <span className="text-xs font-bold text-primary">Step {item.step}</span>
                <h3 className="text-sm font-medium text-foreground mt-1 mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                <button className="mt-3 text-xs text-primary font-medium hover:underline">Try it →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentCreations;
