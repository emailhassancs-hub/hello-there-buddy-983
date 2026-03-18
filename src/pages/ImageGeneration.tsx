import SidebarLayout from "@/components/layout/SidebarLayout";
import { Image, Sparkles } from "lucide-react";

const ImagePage = () => {
  return (
    <SidebarLayout>
      <div className="flex-1 flex flex-col">
        {/* Canvas area - empty state */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base text-foreground font-medium mb-1">Your creations will appear here</p>
            <p className="text-sm text-muted-foreground">Start by typing a prompt below</p>
          </div>
        </div>

        {/* Bottom prompt bar area placeholder */}
        <div className="border-t border-border px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3 border border-border">
              <input
                type="text"
                placeholder="Describe what you want to create…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-40 cursor-not-allowed">
                <Sparkles className="w-4 h-4 inline mr-1.5" />
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ImagePage;
