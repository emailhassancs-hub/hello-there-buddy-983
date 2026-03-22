const BASE = "https://games-ai-studio-ms-image-preprocessing-develop-347148155332.us-central1.run.app/api/v1";

export type GalleryCardType = "image" | "3d" | "editing";

export interface GalleryItem {
  id: string;
  type: GalleryCardType;
  label: string;
  // image type
  imageUrl?: string;
  model?: string;
  ratio?: string;
  resolution?: string;
  prompt?: string;
  // 3d type
  thumbnailUrl?: string;
  glbUrl?: string;
  generationType?: "TEXT_TO_3D" | "IMAGE_TO_3D";
  sourceImageUrl?: string;
  // editing type
  beforeUrl?: string;
  afterUrl?: string;
  technique?: string;
  isBackgroundRemove?: boolean;
}

export const galleryItems: GalleryItem[] = [
  // ROW 1 — Cards 1–5
  {
    id: "g1", type: "image", label: "Orbital Space Station",
    imageUrl: `${BASE}/image-generation/seedream4_1773652726_seedream4_1773652705_0_.png`,
    model: "Seedream4", ratio: "21:9", resolution: "4K",
    prompt: "A colossal orbital space station, advanced modular construction, powerful thrusters, vast solar arrays, cinematic ultra wide-angle lens, advanced ray tracing, studio-grade photorealism.",
  },
  {
    id: "g2", type: "image", label: "Alice in Wonderland — White Rabbit",
    imageUrl: `${BASE}/image-generation/seedream4_1773224832_seedream4_1773224812_0_.png`,
    model: "Seedream4", ratio: "4:3", resolution: "2K",
    prompt: "A frantic White Rabbit from Alice in Wonderland, dressed in a tiny red waistcoat, clutching a gold pocket watch, standing on a winding path of playing cards in a vibrant whimsical garden with bioluminescent mushrooms and floating teacups.",
  },
  {
    id: "g3", type: "3d", label: "Fantasy Warrior",
    thumbnailUrl: `${BASE}/model-images/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.webp`,
    glbUrl: `${BASE}/models/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "A battle-worn fantasy warrior, heavy plate armor with runes, dark fantasy style",
  },
  {
    id: "g4", type: "editing", label: "Apple → Metallic Gold",
    beforeUrl: `${BASE}/image-generation/qwen_1768247733_qwen_1768247702_0_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768248154_seedream4_1768248135_edit_20260113_010215_0c0fb1f3_.png`,
    technique: "Seedream4 Edit",
    prompt: "Change the apple into an object made of polished, shining, metallic gold. It should be highly reflective and lustrous.",
  },
  {
    id: "g5", type: "image", label: "Sci-Fi Weapon Concept",
    imageUrl: `${BASE}/image-generation/qwen_1768213196_qwen_1768213190_0_.png`,
    model: "Qwen", ratio: "16:9", resolution: "Standard",
    prompt: "A concept art of a sleek, futuristic sci-fi gun with a metallic finish, intricate details, and glowing blue energy conduits, presented in a side profile view with dramatic, cinematic lighting.",
  },
  // ROW 2 — Cards 6–10
  {
    id: "g6", type: "image", label: "Sci-Fi Action Scene",
    imageUrl: `${BASE}/image-generation/seedream4_1772431659_seedream4_1772431637_0_.png`,
    model: "Seedream4", ratio: "21:9", resolution: "4K",
    prompt: "Concept art for a sci-fi action film scene. Highly detailed and dynamic cinematic image, dramatic lighting, ultra-wide composition, advanced ray tracing.",
  },
  {
    id: "g7", type: "3d", label: "Sci-Fi Space Rocket",
    thumbnailUrl: `${BASE}/model-images/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.webp`,
    glbUrl: `${BASE}/models/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "scifi space rocket",
  },
  {
    id: "g8", type: "editing", label: "Bowl → Make It Black",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768216656_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768216696_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`,
    technique: "Nano Banana",
    prompt: "make it black",
  },
  {
    id: "g9", type: "image", label: "Battle Hammer — 3D Render",
    imageUrl: `${BASE}/image-generation/seedream4_1768288780_seedream4_1768288760_0_.png`,
    model: "Seedream4", ratio: "16:9", resolution: "2K",
    prompt: "Stylized 3D model render of a powerful battle hammer, dramatic studio lighting, dark fantasy aesthetic, highly detailed textures.",
  },
  {
    id: "g10", type: "image", label: "Medieval Town Square",
    imageUrl: `${BASE}/image-generation/seedream4_1768215481_seedream4_1768215450_0_.png`,
    model: "Seedream4", ratio: "16:9", resolution: "2K",
    prompt: "A bustling medieval town square with cobblestone streets, half-timbered houses, a central fountain, and townspeople in period attire. Detailed realistic style with warm afternoon lighting.",
  },
  // ROW 3 — Cards 11–16
  {
    id: "g11", type: "3d", label: "Spaceship",
    thumbnailUrl: `${BASE}/model-images/a1d2e333-5d57-4477-9be7-08128dc5b6a1.webp`,
    glbUrl: `${BASE}/models/a1d2e333-5d57-4477-9be7-08128dc5b6a1.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "spaceship",
  },
  {
    id: "g12", type: "editing", label: "Golden → Silver Apple Mix",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768258834_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768258850_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
    technique: "Nano Banana",
    prompt: "Make some of the golden apples silver.",
  },
  {
    id: "g13", type: "image", label: "Pixar Whimsical House",
    imageUrl: `${BASE}/image-generation/seedream4_1768215287_seedream4_1768215256_0_.png`,
    model: "Seedream4", ratio: "1:1", resolution: "2K",
    prompt: "A charming, whimsical house designed in the enchanting and vibrant 3D animation style of Pixar. Playful architecture, rounded edges, colorful roof, cozy and welcoming feel, bright cheerful lighting, sunny day.",
  },
  {
    id: "g14", type: "3d", label: "Bicycle",
    thumbnailUrl: `${BASE}/model-images/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.webp`,
    glbUrl: `${BASE}/models/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "a 3D model of a bicycle",
  },
  {
    id: "g15", type: "editing", label: "Text Edit: 'cake mania' → 'you win'",
    beforeUrl: `${BASE}/image-generation/qwen_1772731925_qwen_1772731920_0_.png`,
    afterUrl: `${BASE}/image-editing/qwen_edit_plus_1772740976_output_qwen_edit_plus_1772740970_edit_20260306_010250_c64600be.png`,
    technique: "Qwen Edit Plus",
    prompt: "change the text from 'cake mania' to 'you win'",
  },
  {
    id: "g16", type: "image", label: "Ruby Gemstone Macro",
    imageUrl: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`,
    model: "Qwen", ratio: "1:1", resolution: "Standard",
    prompt: "A magnificent, large, oval-cut ruby gemstone, deep crimson red, sparkling with internal fire, studio lighting, macro photography, on a black velvet background.",
  },
  // ROW 4 — Cards 17–22
  {
    id: "g17", type: "image", label: "City Fireworks Display",
    imageUrl: `${BASE}/image-generation/qwen_1768237268_qwen_1768237245_0_.png`,
    model: "Qwen", ratio: "16:9", resolution: "Standard",
    prompt: "A spectacular fireworks display over a modern city skyline at night. Vibrant, multi-colored explosions illuminate the dark sky. Dramatic, high-quality photograph capturing the energy and beauty.",
  },
  {
    id: "g18", type: "3d", label: "Image → 3D Conversion",
    thumbnailUrl: `${BASE}/model-images/c50accb3-c2c7-486e-a86e-3b1c86033b2f.webp`,
    glbUrl: `${BASE}/models/c50accb3-c2c7-486e-a86e-3b1c86033b2f.glb`,
    generationType: "IMAGE_TO_3D",
    sourceImageUrl: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`,
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "g19", type: "editing", label: "Background Removal",
    beforeUrl: `${BASE}/image-editing/BackgroundRemove_input_1772738025_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa.png`,
    afterUrl: `${BASE}/image-editing/BackgroundRemove_output_1772738042_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa_.png`,
    technique: "Background Remove",
    prompt: "One-click clean background removal — transparent PNG output",
    isBackgroundRemove: true,
  },
  {
    id: "g20", type: "image", label: "Hyper-Realistic Red Rose",
    imageUrl: `${BASE}/image-generation/qwen_1768215150_qwen_1768215135_0_.png`,
    model: "Qwen", ratio: "1:1", resolution: "Standard",
    prompt: "A hyper-realistic close-up of a single, perfect red rose, its velvety petals glistening with tiny morning dew drops. Soft blurred garden background, warm and gentle lighting.",
  },
  {
    id: "g21", type: "image", label: "Cute Cat Portrait",
    imageUrl: `${BASE}/image-generation/seedream4_1768219917_seedream4_1768219894_0_.png`,
    model: "Seedream4", ratio: "1:1", resolution: "2K",
    prompt: "A cute cat, high quality, detailed fur texture, soft studio lighting.",
  },
  {
    id: "g22", type: "image", label: "Futuristic City at Golden Hour",
    imageUrl: `${BASE}/image-generation/qwen_1769766024_qwen_1769765946_0_.png`,
    model: "Qwen", ratio: "16:9", resolution: "Standard",
    prompt: "A magnificent, utopian futuristic city at golden hour, filled with towering holographic skyscrapers, flying vehicles, neon-lit streets, breathtaking cinematic wide-angle composition.",
  },
];
