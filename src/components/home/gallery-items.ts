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
  // editing type
  beforeUrl?: string;
  afterUrl?: string;
  technique?: string;
}

export const galleryItems: GalleryItem[] = [
  // ROW 1
  {
    id: "g1", type: "image", label: "Alice in Wonderland — White Rabbit",
    imageUrl: `${BASE}/image-generation/seedream4_1773224832_seedream4_1773224812_0_.png`,
    model: "Seedream4", ratio: "4:3", resolution: "2K",
    prompt: "A frantic White Rabbit from Alice in Wonderland, in a vibrant whimsical garden with bioluminescent mushrooms and floating teacups.",
  },
  {
    id: "g2", type: "3d", label: "Fantasy Warrior",
    thumbnailUrl: `${BASE}/model-images/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.webp`,
    glbUrl: `${BASE}/models/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "A battle-worn fantasy warrior, heavy plate armor with runes, dark fantasy style",
  },
  {
    id: "g3", type: "image", label: "Orbital Space Station",
    imageUrl: `${BASE}/image-generation/seedream4_1773652726_seedream4_1773652705_0_.png`,
    model: "Seedream4", ratio: "21:9", resolution: "4K",
    prompt: "A colossal orbital space station, advanced modular construction, cinematic long shot, ultra wide-angle, advanced ray tracing.",
  },
  {
    id: "g4", type: "editing", label: "Apple → Metallic Gold",
    beforeUrl: `${BASE}/image-generation/qwen_1768247733_qwen_1768247702_0_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768248154_seedream4_1768248135_edit_20260113_010215_0c0fb1f3_.png`,
    technique: "Seedream4 Edit",
    prompt: "Change the apple into polished, shining metallic gold.",
  },
  {
    id: "g5", type: "image", label: "Sci-Fi Weapon Concept",
    imageUrl: `${BASE}/image-generation/qwen_1768213196_qwen_1768213190_0_.png`,
    model: "Qwen", ratio: "16:9", resolution: "Standard",
    prompt: "Futuristic sci-fi gun with metallic finish and glowing blue energy conduits, cinematic lighting.",
  },
  // ROW 2
  {
    id: "g6", type: "3d", label: "Spaceship",
    thumbnailUrl: `${BASE}/model-images/a1d2e333-5d57-4477-9be7-08128dc5b6a1.webp`,
    glbUrl: `${BASE}/models/a1d2e333-5d57-4477-9be7-08128dc5b6a1.glb`,
    generationType: "TEXT_TO_3D", prompt: "spaceship",
  },
  {
    id: "g7", type: "image", label: "Pixar Whimsical House",
    imageUrl: `${BASE}/image-generation/seedream4_1768215287_seedream4_1768215256_0_.png`,
    model: "Seedream4", ratio: "1:1", resolution: "2K",
    prompt: "A charming whimsical house in Pixar 3D animation style, bright and cheerful, colorful roof, sunny day.",
  },
  {
    id: "g8", type: "editing", label: "Golden → Silver Mix",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768258834_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768258850_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
    technique: "Nano Banana",
    prompt: "Make some of the golden apples silver.",
  },
  {
    id: "g9", type: "3d", label: "Sci-Fi Space Rocket",
    thumbnailUrl: `${BASE}/model-images/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.webp`,
    glbUrl: `${BASE}/models/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.glb`,
    generationType: "TEXT_TO_3D", prompt: "scifi space rocket",
  },
  {
    id: "g10", type: "image", label: "Hyper-Realistic Red Rose",
    imageUrl: `${BASE}/image-generation/qwen_1768215150_qwen_1768215135_0_.png`,
    model: "Qwen", ratio: "1:1", resolution: "Standard",
    prompt: "A hyper-realistic close-up of a perfect red rose with morning dew drops, warm garden lighting.",
  },
  // ROW 3
  {
    id: "g11", type: "image", label: "Medieval Town Square",
    imageUrl: `${BASE}/image-generation/seedream4_1768215481_seedream4_1768215450_0_.png`,
    model: "Seedream4", ratio: "16:9", resolution: "2K",
    prompt: "A bustling medieval town square, cobblestone streets, half-timbered houses, warm afternoon lighting.",
  },
  {
    id: "g12", type: "3d", label: "Bicycle",
    thumbnailUrl: `${BASE}/model-images/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.webp`,
    glbUrl: `${BASE}/models/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.glb`,
    generationType: "TEXT_TO_3D", prompt: "a 3D model of a bicycle",
  },
  {
    id: "g13", type: "editing", label: "Text Edit: 'cake mania' → 'you win'",
    beforeUrl: `${BASE}/image-generation/qwen_1772731925_qwen_1772731920_0_.png`,
    afterUrl: `${BASE}/image-editing/qwen_edit_plus_1772740976_output_qwen_edit_plus_1772740970_edit_20260306_010250_c64600be.png`,
    technique: "Qwen Edit Plus",
    prompt: "Change the text from 'cake mania' to 'you win'.",
  },
  {
    id: "g14", type: "image", label: "Ruby Gemstone Macro",
    imageUrl: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`,
    model: "Qwen", ratio: "1:1", resolution: "Standard",
    prompt: "A magnificent oval-cut ruby gemstone, deep crimson, sparkling with internal fire, studio lighting, macro photography.",
  },
  {
    id: "g15", type: "editing", label: "Background Removal",
    beforeUrl: `${BASE}/image-editing/BackgroundRemove_input_1772738025_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa.png`,
    afterUrl: `${BASE}/image-editing/BackgroundRemove_output_1772738042_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa_.png`,
    technique: "Background Remove",
    prompt: "One-click clean background removal.",
  },
];
