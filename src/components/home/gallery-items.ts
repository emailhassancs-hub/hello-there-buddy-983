const BASE = "https://games-ai-studio-ms-image-preprocessing-develop-347148155332.us-central1.run.app/api/v1";

export type GalleryCardType = "image" | "3d" | "editing";

export interface GalleryItem {
  id: string;
  type: GalleryCardType;
  label: string;
  imageUrl?: string;
  model?: string;
  ratio?: string;
  resolution?: string;
  prompt?: string;
  thumbnailUrl?: string;
  glbUrl?: string;
  generationType?: "TEXT_TO_3D" | "IMAGE_TO_3D";
  sourceImageUrl?: string;
  beforeUrl?: string;
  afterUrl?: string;
  technique?: string;
  isBackgroundRemove?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// 20 IMAGE GENERATION TILES (TYPE A)
// ═══════════════════════════════════════════════════════════════

export const imageItems: GalleryItem[] = [
  {
    id: "a1", type: "image", label: "Orbital Space Station",
    imageUrl: `${BASE}/image-generation/seedream4_1773652726_seedream4_1773652705_0_.png`,
    model: "Seedream4", ratio: "21:9", resolution: "4K",
    prompt: "A colossal orbital space station, advanced modular construction, powerful thrusters, vast solar arrays. Bathed in ethereal starlight. Cinematic ultra wide-angle, advanced ray tracing, studio-grade photorealism.",
  },
  {
    id: "a2", type: "image", label: "Alice in Wonderland — White Rabbit",
    imageUrl: `${BASE}/image-generation/seedream4_1773224832_seedream4_1773224812_0_.png`,
    model: "Seedream4", ratio: "4:3", resolution: "2K",
    prompt: "A frantic White Rabbit from Alice in Wonderland, dressed in a tiny red waistcoat, clutching a gold pocket watch, on a winding path of playing cards in a vibrant whimsical garden with bioluminescent mushrooms and floating teacups.",
  },
  {
    id: "a3", type: "image", label: "Young Alice — Wonderland Portrait",
    imageUrl: `${BASE}/image-generation/seedream4_1773224473_seedream4_1773224451_0_.png`,
    model: "Seedream4", ratio: "4:3", resolution: "4K",
    prompt: "A curious, young Alice with flowing blonde hair and wide-eyed wonder, wearing her iconic blue dress and white apron, surrounded by oversized magical flora and dreamlike Wonderland elements.",
  },
  {
    id: "a4", type: "image", label: "Sci-Fi Weapon Concept",
    imageUrl: `${BASE}/image-generation/qwen_1768213196_qwen_1768213190_0_.png`,
    model: "Qwen", ratio: "16:9", resolution: "Standard",
    prompt: "A concept art of a sleek, futuristic sci-fi gun with a metallic finish, intricate details, and glowing blue energy conduits, presented in side profile view with dramatic, cinematic lighting.",
  },
  {
    id: "a5", type: "image", label: "Sci-Fi Action Scene",
    imageUrl: `${BASE}/image-generation/seedream4_1772431659_seedream4_1772431637_0_.png`,
    model: "Seedream4", ratio: "21:9", resolution: "4K",
    prompt: "Concept art for a sci-fi action film scene. Highly detailed and dynamic cinematic image, dramatic lighting, ultra-wide composition, advanced ray tracing.",
  },
  {
    id: "a6", type: "image", label: "Epic Brawl — Cinematic",
    imageUrl: `${BASE}/image-generation/seedream4_1772431479_seedream4_1772431461_0_.png`,
    model: "Seedream4", ratio: "21:9", resolution: "4K",
    prompt: "A highly detailed and dynamic cinematic image depicting an intense, brutal confrontation. Epic scale, dramatic volumetric lighting, ultra-wide angle, photorealistic detail.",
  },
  {
    id: "a7", type: "image", label: "Epic Fantasy Movie Fight",
    imageUrl: `${BASE}/image-generation/seedream4_1772191827_seedream4_1772191811_0_.png`,
    model: "Seedream4", ratio: "21:9", resolution: "4K",
    prompt: "An epic fantasy movie still depicting a dynamic, cinematic fight scene. Dramatic lighting, vast scale, ultra-wide composition.",
  },
  {
    id: "a8", type: "image", label: "Wizard vs Dragon — Cinematic",
    imageUrl: `${BASE}/image-generation/seedream4_1772190908_seedream4_1772190893_0_.png`,
    model: "Seedream4", ratio: "16:9", resolution: "2K",
    prompt: "A cinematic, realistic shot of a dynamic fight scene between a powerful wizard and a fierce dragon. Epic scale, dramatic lighting.",
  },
  {
    id: "a9", type: "image", label: "Wizard Potion — Product Mockup",
    imageUrl: `${BASE}/image-generation/seedream4_1772190703_seedream4_1772190687_0_.png`,
    model: "Seedream4", ratio: "1:1", resolution: "2K",
    prompt: "High-quality product mockup of a wizard's potion bottle. The bottle should be ornate and mystical, glowing with magical energy, studio lighting.",
  },
  {
    id: "a10", type: "image", label: "Giant Panda Warrior",
    imageUrl: `${BASE}/image-generation/seedream4_1770099383_seedream4_1770099372_0_.png`,
    model: "Seedream4", ratio: "1:1", resolution: "2K",
    prompt: "Epic cinematic scene of a giant panda warrior in ornate armor, clashing with a fierce dragon. Dynamic action pose, dramatic lighting.",
  },
  {
    id: "a11", type: "image", label: "Battle Hammer — 3D Render",
    imageUrl: `${BASE}/image-generation/seedream4_1768288780_seedream4_1768288760_0_.png`,
    model: "Seedream4", ratio: "16:9", resolution: "2K",
    prompt: "Stylized 3D model render of a powerful battle hammer, dramatic studio lighting, dark fantasy aesthetic, highly detailed textures.",
  },
  {
    id: "a12", type: "image", label: "Modern SUV — Cinematic Shot",
    imageUrl: `${BASE}/image-generation/seedream4_1768237953_seedream4_1768237924_0_.png`,
    model: "Seedream4", ratio: "16:9", resolution: "2K",
    prompt: "A hyper-realistic, cinematic shot of a modern, rugged dark blue SUV navigating a winding mountain road at golden hour.",
  },
  {
    id: "a13", type: "image", label: "Majestic Long-Haired Cat",
    imageUrl: `${BASE}/image-generation/seedream4_1768237793_seedream4_1768237761_0_.png`,
    model: "Seedream4", ratio: "4:3", resolution: "2K",
    prompt: "A hyper-detailed, photorealistic portrait of an incredibly fluffy, majestic long-haired cat with striking eyes.",
  },
  {
    id: "a14", type: "image", label: "Medieval Town Square",
    imageUrl: `${BASE}/image-generation/seedream4_1768215481_seedream4_1768215450_0_.png`,
    model: "Seedream4", ratio: "16:9", resolution: "2K",
    prompt: "A bustling medieval town square with cobblestone streets, half-timbered houses, a central fountain, and townspeople in period attire. Detailed realistic style with warm afternoon lighting.",
  },
  {
    id: "a15", type: "image", label: "Pixar Whimsical House",
    imageUrl: `${BASE}/image-generation/seedream4_1768215287_seedream4_1768215256_0_.png`,
    model: "Seedream4", ratio: "1:1", resolution: "2K",
    prompt: "A charming, whimsical house designed in the enchanting and vibrant 3D animation style of Pixar. Playful architecture, rounded edges, colorful roof, bright cheerful lighting, sunny day.",
  },
  {
    id: "a16", type: "image", label: "Cute Cat Portrait",
    imageUrl: `${BASE}/image-generation/seedream4_1768219917_seedream4_1768219894_0_.png`,
    model: "Seedream4", ratio: "1:1", resolution: "2K",
    prompt: "A cute cat, high quality, detailed fur texture, soft studio lighting.",
  },
  {
    id: "a17", type: "image", label: "Ruby Gemstone Macro",
    imageUrl: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`,
    model: "Qwen", ratio: "1:1", resolution: "Standard",
    prompt: "A magnificent, large, oval-cut ruby gemstone, deep crimson red, sparkling with internal fire, studio lighting, macro photography, black velvet background.",
  },
  {
    id: "a18", type: "image", label: "City Fireworks Display",
    imageUrl: `${BASE}/image-generation/qwen_1768237268_qwen_1768237245_0_.png`,
    model: "Qwen", ratio: "16:9", resolution: "Standard",
    prompt: "A spectacular fireworks display over a modern city skyline at night. Vibrant, multi-colored explosions illuminate the dark sky. Dramatic, high-quality photograph capturing the energy and beauty.",
  },
  {
    id: "a19", type: "image", label: "Hyper-Realistic Red Rose",
    imageUrl: `${BASE}/image-generation/qwen_1768215150_qwen_1768215135_0_.png`,
    model: "Qwen", ratio: "1:1", resolution: "Standard",
    prompt: "A hyper-realistic close-up of a single, perfect red rose, its velvety petals glistening with tiny morning dew drops. Soft blurred garden background, warm and gentle lighting.",
  },
  {
    id: "a20", type: "image", label: "Futuristic City at Golden Hour",
    imageUrl: `${BASE}/image-generation/qwen_1769766024_qwen_1769765946_0_.png`,
    model: "Qwen", ratio: "16:9", resolution: "Standard",
    prompt: "A magnificent, utopian futuristic city at golden hour, filled with towering holographic skyscrapers, flying vehicles, neon-lit streets, breathtaking cinematic wide-angle composition.",
  },
];

// ═══════════════════════════════════════════════════════════════
// 20 3D MODEL TILES (TYPE B) — 12 TEXT_TO_3D + 8 IMAGE_TO_3D
// ═══════════════════════════════════════════════════════════════

export const threeDItems: GalleryItem[] = [
  {
    id: "b1", type: "3d", label: "Fantasy Warrior",
    thumbnailUrl: `${BASE}/model-images/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.webp`,
    glbUrl: `${BASE}/models/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "A battle-worn fantasy warrior, heavy plate armor with runes, dark fantasy style",
  },
  {
    id: "b2", type: "3d", label: "Fantasy Warrior — 4K Detail",
    thumbnailUrl: `${BASE}/model-images/f60be5ee-916e-469d-b24a-56bbba28881c.webp`,
    glbUrl: `${BASE}/models/f60be5ee-916e-469d-b24a-56bbba28881c.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "A battle-worn fantasy warrior, heavy plate armor with runes, dark fantasy style, 4K detail",
  },
  {
    id: "b3", type: "3d", label: "Sci-Fi Space Rocket",
    thumbnailUrl: `${BASE}/model-images/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.webp`,
    glbUrl: `${BASE}/models/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "scifi space rocket",
  },
  {
    id: "b4", type: "3d", label: "Spaceship",
    thumbnailUrl: `${BASE}/model-images/a1d2e333-5d57-4477-9be7-08128dc5b6a1.webp`,
    glbUrl: `${BASE}/models/a1d2e333-5d57-4477-9be7-08128dc5b6a1.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "spaceship",
  },
  {
    id: "b5", type: "3d", label: "Bicycle",
    thumbnailUrl: `${BASE}/model-images/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.webp`,
    glbUrl: `${BASE}/models/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "a 3D model of a bicycle",
  },
  {
    id: "b6", type: "3d", label: "Wicker Basket",
    thumbnailUrl: `${BASE}/model-images/ff623697-ecb1-4ae7-989e-7a09dd2478b9.webp`,
    glbUrl: `${BASE}/models/ff623697-ecb1-4ae7-989e-7a09dd2478b9.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "a basket",
  },
  {
    id: "b7", type: "3d", label: "Mirror",
    thumbnailUrl: `${BASE}/model-images/7e6348c7-d114-426a-af03-04f7ead90e17.webp`,
    glbUrl: `${BASE}/models/7e6348c7-d114-426a-af03-04f7ead90e17.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "a mirror",
  },
  {
    id: "b8", type: "3d", label: "Cat — 3D Model",
    thumbnailUrl: `${BASE}/model-images/3ad22dd6-e10d-4bec-b76e-f6b3a62e0bfd.webp`,
    glbUrl: `${BASE}/models/3ad22dd6-e10d-4bec-b76e-f6b3a62e0bfd.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "A cat",
  },
  {
    id: "b9", type: "3d", label: "Cat — v2",
    thumbnailUrl: `${BASE}/model-images/792a23c5-69f1-4556-8cff-135374a0a2ac.webp`,
    glbUrl: `${BASE}/models/792a23c5-69f1-4556-8cff-135374a0a2ac.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "cat",
  },
  {
    id: "b10", type: "3d", label: "Cat — 3D Generated",
    thumbnailUrl: `${BASE}/model-images/0a49f748-b64e-42af-a4bc-f556e93eae22.webp`,
    glbUrl: `${BASE}/models/0a49f748-b64e-42af-a4bc-f556e93eae22.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "generate 3d model of a cat",
  },
  {
    id: "b11", type: "3d", label: "Cat — v3",
    thumbnailUrl: `${BASE}/model-images/5eb5280c-4f8b-4cb4-b5ca-f1081d5801db.webp`,
    glbUrl: `${BASE}/models/5eb5280c-4f8b-4cb4-b5ca-f1081d5801db.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "a cat",
  },
  {
    id: "b12", type: "3d", label: "Ice Cream — 3D",
    thumbnailUrl: `${BASE}/model-images/a127c8f9-b237-4347-ae8a-2fd15613e15d.webp`,
    glbUrl: `${BASE}/models/a127c8f9-b237-4347-ae8a-2fd15613e15d.glb`,
    generationType: "TEXT_TO_3D",
    prompt: "An icecream",
  },
  {
    id: "b13", type: "3d", label: "Image → 3D Conversion #1",
    thumbnailUrl: `${BASE}/model-images/c50accb3-c2c7-486e-a86e-3b1c86033b2f.webp`,
    glbUrl: `${BASE}/models/c50accb3-c2c7-486e-a86e-3b1c86033b2f.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "b14", type: "3d", label: "Image → 3D Conversion #2",
    thumbnailUrl: `${BASE}/model-images/9a39de7b-4908-4952-a613-72ca3568596a.webp`,
    glbUrl: `${BASE}/models/9a39de7b-4908-4952-a613-72ca3568596a.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "b15", type: "3d", label: "Image → 3D Conversion #3",
    thumbnailUrl: `${BASE}/model-images/f1681708-6674-42b5-9aee-0948852cf0aa.webp`,
    glbUrl: `${BASE}/models/f1681708-6674-42b5-9aee-0948852cf0aa.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "b16", type: "3d", label: "Image → 3D Conversion #4",
    thumbnailUrl: `${BASE}/model-images/4225f675-5da1-4773-9b6d-8e9b839eab4d.webp`,
    glbUrl: `${BASE}/models/4225f675-5da1-4773-9b6d-8e9b839eab4d.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "b17", type: "3d", label: "Image → 3D Conversion #5",
    thumbnailUrl: `${BASE}/model-images/9a4ca67a-ba62-41f3-b446-664381b3b484.webp`,
    glbUrl: `${BASE}/models/9a4ca67a-ba62-41f3-b446-664381b3b484.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "b18", type: "3d", label: "Image → 3D Conversion #6",
    thumbnailUrl: `${BASE}/model-images/33d8b7bb-5e94-406a-bef2-89405d3ce56e.webp`,
    glbUrl: `${BASE}/models/33d8b7bb-5e94-406a-bef2-89405d3ce56e.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "b19", type: "3d", label: "Image → 3D Conversion #7",
    thumbnailUrl: `${BASE}/model-images/f4346407-98f1-45a7-a86e-360cd84ffc31.webp`,
    glbUrl: `${BASE}/models/f4346407-98f1-45a7-a86e-360cd84ffc31.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
  {
    id: "b20", type: "3d", label: "Image → 3D Conversion #8",
    thumbnailUrl: `${BASE}/model-images/f731d228-79ce-4a64-8192-2463939b7ea1.webp`,
    glbUrl: `${BASE}/models/f731d228-79ce-4a64-8192-2463939b7ea1.glb`,
    generationType: "IMAGE_TO_3D",
    prompt: "Photo-based 3D reconstruction — PBR textured midpoly mesh",
  },
];

// ═══════════════════════════════════════════════════════════════
// 20 IMAGE EDITING TILES (TYPE C)
// ═══════════════════════════════════════════════════════════════

export const editingItems: GalleryItem[] = [
  {
    id: "c1", type: "editing", label: "Bowl → Make It Black",
    technique: "Nano Banana", prompt: "make it black",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768216656_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768216696_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`,
  },
  {
    id: "c2", type: "editing", label: "Apple → Metallic Gold",
    technique: "Seedream4 Edit", prompt: "Change the apple into an object made of polished, shining, metallic gold. Highly reflective and lustrous.",
    beforeUrl: `${BASE}/image-generation/qwen_1768247733_qwen_1768247702_0_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768248154_seedream4_1768248135_edit_20260113_010215_0c0fb1f3_.png`,
  },
  {
    id: "c3", type: "editing", label: "Gold Apple → Polished Silver",
    technique: "Seedream4 Edit", prompt: "Change the metallic golden apple into a polished, shining silver apple. Keep the metallic and reflective texture.",
    beforeUrl: `${BASE}/image-editing/Seedream4Edit_output_1768248154_seedream4_1768248135_edit_20260113_010215_0c0fb1f3_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768248220_seedream4_1768248202_edit_20260113_010322_be2d98fc_.png`,
  },
  {
    id: "c4", type: "editing", label: "Golden Apples → Silver Mix",
    technique: "Nano Banana", prompt: "make some of the golden apples silver",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768258834_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768258850_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
  },
  {
    id: "c5", type: "editing", label: "Silver Apples → Bronze",
    technique: "Seedream4 Edit", prompt: "make a few of the silver apples bronze",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768258850_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768258910_seedream4_1768258900_edit_20260113_040140_06d9b7eb_.png`,
  },
  {
    id: "c6", type: "editing", label: "Sword — Adjust Aspect Ratio",
    technique: "Qwen Edit Plus", prompt: "Adjust the aspect ratio of the image to 4:3, keeping the sword centered.",
    beforeUrl: `${BASE}/image-editing/qwen_edit_plus_1768288418_input_qwen_edit_plus_1768288417_edit_20260113_121338_b090679f.png`,
    afterUrl: `${BASE}/image-editing/qwen_edit_plus_1768288463_output_qwen_edit_plus_1768288417_edit_20260113_121338_b090679f.png`,
  },
  {
    id: "c7", type: "editing", label: "Sword → Visual Appeal",
    technique: "Seedream4 Edit", prompt: "Make this sword look more visually appealing for a landing page.",
    beforeUrl: `${BASE}/image-editing/qwen_edit_plus_1768288463_output_qwen_edit_plus_1768288417_edit_20260113_121338_b090679f.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768288560_seedream4_1768288542_edit_20260113_121542_0bfc794e_.png`,
  },
  {
    id: "c8", type: "editing", label: "Grapes → Green",
    technique: "Qwen Edit Plus", prompt: "make the grapes green",
    beforeUrl: `${BASE}/image-editing/qwen_edit_plus_1768295574_input_qwen_edit_plus_1768295573_edit_20260113_141253_866eaeae.png`,
    afterUrl: `${BASE}/image-editing/qwen_edit_plus_1768295593_output_qwen_edit_plus_1768295573_edit_20260113_141253_866eaeae.png`,
  },
  {
    id: "c9", type: "editing", label: "Character + Blue Car Scene",
    technique: "Nano Banana", prompt: "A character standing near a blue car",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768296388_nano_banana_1768296388_edit_20260113_142628_ce67791e_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768296403_nano_banana_1768296388_edit_20260113_142628_ce67791e_.png`,
  },
  {
    id: "c10", type: "editing", label: "Character Holds the Gun",
    technique: "Nano Banana", prompt: "Make the character hold the gun",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1_1768296757_nano_banana_1768296757_edit_20260113_143237_982ca213_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1768296771_nano_banana_1768296757_edit_20260113_143237_982ca213_.png`,
  },
  {
    id: "c11", type: "editing", label: "Cat Detective + Companion",
    technique: "Seedream4 Edit", prompt: "Add an older, distinguished male cat wearing a smart outfit standing beside the detective cat.",
    beforeUrl: `${BASE}/image-generation/qwen_1768568718_qwen_1768568697_0_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768568857_seedream4_1768568843_edit_20260116_180723_67aa5b0d_.png`,
  },
  {
    id: "c12", type: "editing", label: "Medieval Street → Plague-Ridden",
    technique: "Seedream4 Edit", prompt: "Transform the street into a grim, plague-ridden old town. Dark atmosphere, dramatic.",
    beforeUrl: `${BASE}/image-generation/qwen_1768569214_qwen_1768569193_0_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1768569314_seedream4_1768569293_edit_20260116_181453_470d5d14_.png`,
  },
  {
    id: "c13", type: "editing", label: "Croissant + Cup of Coffee",
    technique: "Nano Banana", prompt: "place a cup of coffee beside the croissant in the image",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1769761948_nano_banana_1769761947_edit_20260130_133228_7b0503d0.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1769761965_nano_banana_1769761947_edit_20260130_133228_7b0503d0_.png`,
  },
  {
    id: "c14", type: "editing", label: "Flower → Pink",
    technique: "Nano Banana", prompt: "change color of this flower to pink",
    beforeUrl: `${BASE}/image-editing/NanoBananaEdit_input_1769969595_nano_banana_1769969595_edit_20260201_231315_c2a1777c.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1769969651_nano_banana_1769969595_edit_20260201_231315_c2a1777c_.png`,
  },
  {
    id: "c15", type: "editing", label: "Flower → Yellow (Qwen)",
    technique: "Qwen Edit Plus", prompt: "make this flower yellow",
    beforeUrl: `${BASE}/image-generation/seedream4_1769970436_seedream4_1769970377_0_.png`,
    afterUrl: `${BASE}/image-editing/qwen_edit_plus_1770024653_output_qwen_edit_plus_1770024642_edit_20260202_143042_f869f00e.png`,
  },
  {
    id: "c16", type: "editing", label: "Flower → Yellow (Seedream4)",
    technique: "Seedream4 Edit", prompt: "make this flower yellow",
    beforeUrl: `${BASE}/image-generation/seedream4_1769970436_seedream4_1769970377_0_.png`,
    afterUrl: `${BASE}/image-editing/Seedream4Edit_output_1770025033_seedream4_1770025020_edit_20260202_143700_933dba6f_.png`,
  },
  {
    id: "c17", type: "editing", label: "Panda + City Background",
    technique: "Nano Banana", prompt: "Place the subject in a city. Ensure the lighting and shadows are consistent.",
    beforeUrl: `${BASE}/image-generation/qwen_1770098405_qwen_1770098401_0_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1770098480_nano_banana_1770098470_edit_20260203_110110_4f5059b1_.png`,
  },
  {
    id: "c18", type: "editing", label: "Panda Flying Kick at Dragon",
    technique: "Nano Banana", prompt: "a panda doing a flying kick to the dragon",
    beforeUrl: `${BASE}/image-generation/seedream4_1770099383_seedream4_1770099372_0_.png`,
    afterUrl: `${BASE}/image-editing/NanoBananaEdit_output_1770099570_nano_banana_1770099560_edit_20260203_111920_5cc17246_.png`,
  },
  {
    id: "c19", type: "editing", label: "Bakery → Winter Weather",
    technique: "Flux Kontext", prompt: "Make the weather in the image winter.",
    beforeUrl: `${BASE}/image-generation/qwen_1770748176_qwen_1770748162_0_.png`,
    afterUrl: `${BASE}/image-editing/flux_kotext_output_1770751051_flux_kontext_1770751045_edit_20260211_001725_da82515e.png`,
  },
  {
    id: "c20", type: "editing", label: "Text: 'cake mania' → 'you win'",
    technique: "Qwen Edit Plus", prompt: "change the text from 'cake mania' to 'you win'",
    beforeUrl: `${BASE}/image-generation/qwen_1772731925_qwen_1772731920_0_.png`,
    afterUrl: `${BASE}/image-editing/qwen_edit_plus_1772740976_output_qwen_edit_plus_1772740970_edit_20260306_010250_c64600be.png`,
  },
];

// ═══════════════════════════════════════════════════════════════
// Combined interleaved array for "All" tab: A1 B1 C1 A2 B2 C2 ...
// ═══════════════════════════════════════════════════════════════

function interleave(): GalleryItem[] {
  const result: GalleryItem[] = [];
  const max = Math.max(imageItems.length, threeDItems.length, editingItems.length);
  for (let i = 0; i < max; i++) {
    if (i < imageItems.length) result.push(imageItems[i]);
    if (i < threeDItems.length) result.push(threeDItems[i]);
    if (i < editingItems.length) result.push(editingItems[i]);
  }
  return result;
}

export const galleryItems: GalleryItem[] = interleave();
