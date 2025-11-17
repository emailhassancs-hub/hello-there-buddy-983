import { motion } from "framer-motion";

const characters = [
  { name: "Chun-Li", image: "chichi_martial_arts_qwen.png" },
  { name: "Magma", image: "demon_slayer_yellow_lace.png" },
  { name: "Madara", image: "anime_girl_black_hair.png" },
  { name: "Mia", image: "anime_girl_red_outfit_guardian.png" },
];

export const CharacterBar = () => {
  return (
    <div className="h-28 border-b border-border bg-card/50 flex items-center justify-center gap-8 px-4">
      {characters.map((character, index) => (
        <motion.div
          key={character.name}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.7 + index * 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="h-20 w-20 rounded-full border-2 border-primary/30 overflow-hidden bg-muted">
            <img
              src={`https://image.pollinations.ai/prompt/${character.image}`}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </div>
          <span className="text-xs font-medium text-foreground">{character.name}</span>
        </motion.div>
      ))}
    </div>
  );
};
