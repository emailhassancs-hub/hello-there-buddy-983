const suggestions = [
  {
    label: "Game Character",
    prompt:
      "A battle-worn fantasy warrior, heavy plate armor with runes, PBR textures, dark fantasy style, 4K detail",
  },
  {
    label: "Sci-fi Environment",
    prompt:
      "A futuristic sci-fi space station interior, neon lighting, zero-gravity, volumetric fog, cinematic",
  },
  {
    label: "Seamless Texture",
    prompt:
      "Seamless tileable mossy stone wall, worn surface, dark fantasy, 2K resolution, PBR maps ready",
  },
  {
    label: "Low-poly Prop",
    prompt:
      "Low-poly ancient wooden chest, stylized, game-ready, UV unwrapped, warm lighting",
  },
  {
    label: "Concept Art",
    prompt:
      "Epic concept art of a dark fantasy city at night, torch-lit cobblestone streets, dramatic sky",
  },
  {
    label: "Space Station",
    prompt:
      "Massive orbital space station exterior, hard surface detail, sci-fi, metallic, star field background",
  },
  {
    label: "Fantasy Weapon",
    prompt:
      "Ornate elven sword, glowing magical runes, intricate filigree, PBR metallic, dark background",
  },
];

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
}

const SuggestionChips = ({ onSelect }: SuggestionChipsProps) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.prompt)}
          className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
