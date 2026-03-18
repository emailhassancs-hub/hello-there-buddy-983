import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

const carouselItems = [
  {
    title: "Flux Kontext Editor",
    description: "Precise color & material edits",
    image: "https://resources.rapidassets.ai/api/v1/image-editing/ColorChanger.webp",
    isNew: true,
  },
  {
    title: "Text to 3D v2",
    description: "Higher quality mesh generation",
    image: "https://resources.rapidassets.ai/api/v1/image-editing/potion.webp",
    isNew: true,
  },
  {
    title: "Character Turnarounds",
    description: "Multi-angle character sheets",
    image: "https://resources.rapidassets.ai/api/v1/image-editing/turnaround.webp",
    isNew: false,
  },
  {
    title: "2D Prop Generation",
    description: "Game-ready 2D assets",
    image: "https://resources.rapidassets.ai/api/v1/image-editing/2d_prop.webp",
    isNew: false,
  },
  {
    title: "Sketch to Color",
    description: "Colorize line art instantly",
    image: "https://resources.rapidassets.ai/api/v1/image-editing/sketch.webp",
    isNew: false,
  },
];

const WhatsNewCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">What's New</h2>
          <div className="flex gap-1">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        >
          {carouselItems.map((item) => (
            <div
              key={item.title}
              className="flex-shrink-0 w-[220px] group cursor-pointer"
            >
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted border border-border mb-2">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.isNew && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-red-500 text-white">
                    New
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                </div>
              </div>
              <p className="text-xs font-medium text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatsNewCarousel;
