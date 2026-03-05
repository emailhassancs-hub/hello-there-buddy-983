import { Heart } from "lucide-react";

const communityCards = [
  { prompt: "A battle-worn orc warlord, cinematic lighting", user: "PixelForge", initials: "PF", likes: 142 },
  { prompt: "Futuristic mech suit, anime style, cel-shaded", user: "NeonArtist", initials: "NA", likes: 89 },
  { prompt: "Enchanted forest environment, stylized 3D", user: "GameDev42", initials: "GD", likes: 231 },
  { prompt: "Medieval tavern interior, warm tones, cozy", user: "AssetKing", initials: "AK", likes: 67 },
  { prompt: "Crystal dragon, iridescent scales, PBR", user: "3DMaster", initials: "3M", likes: 178 },
  { prompt: "Post-apocalyptic cityscape, volumetric fog", user: "ScenePro", initials: "SP", likes: 95 },
];

const filterTabs = ["Trending", "New", "Staff Picks"];

const CommunitySection = () => {
  return (
    <section className="px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Community Creations</h2>
        </div>

        {/* Filter tabs - disabled coming soon */}
        <div className="flex gap-2 mb-5">
          {filterTabs.map((tab) => (
            <span
              key={tab}
              className="px-3 py-1 text-xs rounded-full border border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Community grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communityCards.map((card, i) => (
            <div
              key={i}
              className="relative rounded-lg border border-border overflow-hidden"
            >
              {/* Gradient thumbnail */}
              <div className="h-[140px] bg-gradient-to-br from-muted to-accent relative">
                {/* Blur overlay + Coming Soon */}
                <div className="absolute inset-0 backdrop-blur-md bg-background/40 flex items-center justify-center">
                  <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border border-border bg-background/80 text-muted-foreground">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Card info */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{card.prompt}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-semibold">
                      {card.initials}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {card.user}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="w-3 h-3" />
                    <span className="text-[11px]">{card.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
