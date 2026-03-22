const BASE = "https://games-ai-studio-ms-image-preprocessing-develop-347148155332.us-central1.run.app/api/v1";

export interface ImageGenExample {
  id: string;
  label: string;
  model: "Qwen" | "Seedream4";
  aspectRatio: string;
  resolution: "Standard" | "2K" | "4K";
  prompt: string;
  imageUrl: string;
}

export interface ThreeDExample {
  id: string;
  label: string;
  generationType: "TEXT_TO_3D" | "IMAGE_TO_3D";
  prompt?: string;
  inputImageUrl?: string;
  thumbnailUrl: string;
  modelUrl: string;
  specs: { version: string; quality: string; format: string };
}

export interface ImageEditExample {
  id: string;
  label: string;
  technique: string;
  model: string;
  editPrompt: string | null;
  inputUrl: string;
  outputUrl: string;
  isBackgroundRemove?: boolean;
}

export const imageGenExamples: ImageGenExample[] = [
  {
    id: "IG-1",
    label: "Sci-Fi Weapon Concept",
    model: "Qwen",
    aspectRatio: "16:9",
    resolution: "Standard",
    prompt: "A concept art of a sleek, futuristic sci-fi gun with a metallic finish, intricate details, and glowing blue energy conduits, presented in a side profile view with dramatic, cinematic lighting.",
    imageUrl: `${BASE}/image-generation/qwen_1768213196_qwen_1768213190_0_.png`,
  },
  {
    id: "IG-2",
    label: "Perfect Red Rose",
    model: "Qwen",
    aspectRatio: "1:1",
    resolution: "Standard",
    prompt: "A hyper-realistic close-up of a single, perfect red rose, its velvety petals glistening with tiny morning dew drops. The background is a soft, blurred garden, and the lighting is warm and gentle, emphasizing the rich red color and delicate texture of the rose.",
    imageUrl: `${BASE}/image-generation/qwen_1768215150_qwen_1768215135_0_.png`,
  },
  {
    id: "IG-3",
    label: "Pixar Whimsical House",
    model: "Seedream4",
    aspectRatio: "1:1",
    resolution: "2K",
    prompt: "A charming, whimsical house designed in the enchanting and vibrant 3D animation style of Pixar. The house should have playful architecture, with rounded edges, a colorful roof, and a cozy, welcoming feel.",
    imageUrl: `${BASE}/image-generation/seedream4_1768215287_seedream4_1768215256_0_.png`,
  },
  {
    id: "IG-4",
    label: "Medieval Town Square",
    model: "Seedream4",
    aspectRatio: "16:9",
    resolution: "2K",
    prompt: "A bustling medieval town square with cobblestone streets, half-timbered houses, a central fountain, and townspeople in period attire. The scene is captured in a detailed, realistic style with warm, afternoon lighting.",
    imageUrl: `${BASE}/image-generation/seedream4_1768215481_seedream4_1768215450_0_.png`,
  },
  {
    id: "IG-5",
    label: "Ruby Gemstone Macro",
    model: "Qwen",
    aspectRatio: "1:1",
    resolution: "Standard",
    prompt: "A magnificent, large, oval-cut ruby gemstone, deep crimson red, sparkling with internal fire, studio lighting, macro photography, on a black velvet background.",
    imageUrl: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`,
  },
  {
    id: "IG-6",
    label: "Alice in Wonderland — White Rabbit",
    model: "Seedream4",
    aspectRatio: "4:3",
    resolution: "2K",
    prompt: "A frantic White Rabbit from 'Alice in Wonderland', dressed in a tiny red waistcoat, spectacles perched on his nose, and clutching a large gold pocket watch, looking anxiously at the watch with a hurried expression.",
    imageUrl: `${BASE}/image-generation/seedream4_1773224832_seedream4_1773224812_0_.png`,
  },
  {
    id: "IG-7",
    label: "Orbital Space Station",
    model: "Seedream4",
    aspectRatio: "21:9",
    resolution: "4K",
    prompt: "A colossal, intricately designed orbital space station exterior, featuring advanced modular construction, powerful visible thrusters, vast and complex solar arrays. Cinematic long shot, ultra wide-angle lens. Rendered with advanced ray tracing and studio-grade photorealism.",
    imageUrl: `${BASE}/image-generation/seedream4_1773652726_seedream4_1773652705_0_.png`,
  },
];

export const threeDExamples: ThreeDExample[] = [
  {
    id: "3D-T1",
    label: "Wicker Basket",
    generationType: "TEXT_TO_3D",
    prompt: "a basket",
    thumbnailUrl: `${BASE}/model-images/ff623697-ecb1-4ae7-989e-7a09dd2478b9.webp`,
    modelUrl: `${BASE}/models/ff623697-ecb1-4ae7-989e-7a09dd2478b9.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
  {
    id: "3D-T2",
    label: "Bicycle",
    generationType: "TEXT_TO_3D",
    prompt: "a 3D model of a bicycle",
    thumbnailUrl: `${BASE}/model-images/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.webp`,
    modelUrl: `${BASE}/models/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
  {
    id: "3D-T3",
    label: "Spaceship",
    generationType: "TEXT_TO_3D",
    prompt: "spaceship",
    thumbnailUrl: `${BASE}/model-images/a1d2e333-5d57-4477-9be7-08128dc5b6a1.webp`,
    modelUrl: `${BASE}/models/a1d2e333-5d57-4477-9be7-08128dc5b6a1.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
  {
    id: "3D-T4",
    label: "Sci-Fi Space Rocket",
    generationType: "TEXT_TO_3D",
    prompt: "scifi space rocket",
    thumbnailUrl: `${BASE}/model-images/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.webp`,
    modelUrl: `${BASE}/models/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
  {
    id: "3D-T5",
    label: "Fantasy Warrior",
    generationType: "TEXT_TO_3D",
    prompt: "A battle-worn fantasy warrior, heavy plate armor with runes, dark fantasy style",
    thumbnailUrl: `${BASE}/model-images/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.webp`,
    modelUrl: `${BASE}/models/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
  {
    id: "3D-I1",
    label: "Image to 3D — Object #1",
    generationType: "IMAGE_TO_3D",
    inputImageUrl: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`,
    thumbnailUrl: `${BASE}/model-images/c50accb3-c2c7-486e-a86e-3b1c86033b2f.webp`,
    modelUrl: `${BASE}/models/c50accb3-c2c7-486e-a86e-3b1c86033b2f.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
  {
    id: "3D-I2",
    label: "Image to 3D — Object #2",
    generationType: "IMAGE_TO_3D",
    inputImageUrl: `${BASE}/image-generation/seedream4_1773214132_seedream4_1773214122_0_.png`,
    thumbnailUrl: `${BASE}/model-images/9a39de7b-4908-4952-a613-72ca3568596a.webp`,
    modelUrl: `${BASE}/models/9a39de7b-4908-4952-a613-72ca3568596a.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
  {
    id: "3D-I3",
    label: "Image to 3D — Object #3",
    generationType: "IMAGE_TO_3D",
    inputImageUrl: `${BASE}/image-generation/qwen_1768215150_qwen_1768215135_0_.png`,
    thumbnailUrl: `${BASE}/model-images/f1681708-6674-42b5-9aee-0948852cf0aa.webp`,
    modelUrl: `${BASE}/models/f1681708-6674-42b5-9aee-0948852cf0aa.glb`,
    specs: { version: "v3", quality: "midpoly", format: "GLB" },
  },
];

export const imageEditExamples: ImageEditExample[] = [
  {
    id: "IE-1",
    label: "Make the Car Golden",
    technique: "Flux Kontext",
    model: "flux-kontext",
    editPrompt: "make the car golden",
    inputUrl: `${BASE}/image-generation/qwen_1768213196_qwen_1768213190_0_.png`,
    outputUrl: `${BASE}/image-editing/flux_kotext_output_1768215823_flux_kontext_1768215802_edit_20260112_160322_0210b238.png`,
  },
  {
    id: "IE-2",
    label: "Apple → Metallic Gold",
    technique: "Seedream4 Edit",
    model: "seedream4",
    editPrompt: "Change the apple into an object made of polished, shining, metallic gold. It should be highly reflective and lustrous.",
    inputUrl: `${BASE}/image-generation/qwen_1768247733_qwen_1768247702_0_.png`,
    outputUrl: `${BASE}/image-editing/Seedream4Edit_output_1768248154_seedream4_1768248135_edit_20260113_010215_0c0fb1f3_.png`,
  },
  {
    id: "IE-3",
    label: "Bowl → Black",
    technique: "Nano Banana",
    model: "nano-banana",
    editPrompt: "make it black",
    inputUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768216656_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`,
    outputUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768216696_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`,
  },
  {
    id: "IE-4",
    label: "All Apples → Golden",
    technique: "Flux Kontext",
    model: "flux-kontext",
    editPrompt: "change all the apples in the basket to be golden",
    inputUrl: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`,
    outputUrl: `${BASE}/image-editing/flux_kotext_output_1768258790_flux_kontext_1768258773_edit_20260113_035933_bfb7006e.png`,
  },
  {
    id: "IE-5",
    label: "Golden → Silver Mix",
    technique: "Nano Banana",
    model: "nano-banana",
    editPrompt: "make some of the golden apples silver",
    inputUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768258834_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
    outputUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768258850_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
  },
  {
    id: "IE-6",
    label: 'Text Edit — "cake mania" → "you win"',
    technique: "Qwen Edit Plus",
    model: "qwen-plus",
    editPrompt: "change the text from 'cake mania' to 'you win'",
    inputUrl: `${BASE}/image-generation/qwen_1772731925_qwen_1772731920_0_.png`,
    outputUrl: `${BASE}/image-editing/qwen_edit_plus_1772740976_output_qwen_edit_plus_1772740970_edit_20260306_010250_c64600be.png`,
  },
  {
    id: "IE-7",
    label: "Background Removal",
    technique: "Background Remove",
    model: "INSPYRENET",
    editPrompt: null,
    inputUrl: `${BASE}/image-editing/BackgroundRemove_input_1772738025_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa.png`,
    outputUrl: `${BASE}/image-editing/BackgroundRemove_output_1772738042_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa_.png`,
    isBackgroundRemove: true,
  },
];
