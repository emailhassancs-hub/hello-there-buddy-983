import { useState } from "react";
import { Image } from "lucide-react";

const tabs = ["Recent Creations", "Community Showcase"] as const;

const RecentCreations = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Recent Creations");

  return (
    <section className="px-6 md:px-10 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Empty state for Recent */}
        {activeTab === "Recent Creations" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Image className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Your creations will appear here</p>
            <button
              onClick={() => {
                const textarea = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Describe"]');
                textarea?.focus();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs text-primary hover:underline mt-1"
            >
              → Start creating
            </button>
          </div>
        )}

        {/* Community tab placeholder */}
        {activeTab === "Community Showcase" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted shimmer-card" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentCreations;
