import SidebarLayout from "@/components/layout/SidebarLayout";
import PromptBar from "@/components/home/PromptBar";
import { Image } from "lucide-react";

const ImagePage = () => {
  return (
    <SidebarLayout>
      <div className="flex-1 flex flex-col">
        {/* Page header */}
        <div className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Image Generation</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Generate stunning images from a text prompt</p>
        </div>

        {/* Canvas area - empty state */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-primary" />
            </div>
            <p className="text-base text-foreground font-medium mb-1">Your creations will appear in Studio</p>
            <p className="text-sm text-muted-foreground">Type a prompt below and click Create to start generating</p>
          </div>
        </div>

        {/* PromptBar */}
        <div className="border-t border-border px-6 py-4">
          <PromptBar />
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ImagePage;
