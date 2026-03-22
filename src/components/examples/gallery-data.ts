const BASE = "https://games-ai-studio-ms-image-preprocessing-develop-347148155332.us-central1.run.app/api/v1";

// ── Types ──────────────────────────────────────────────────────
export interface ImageGenItem {
  id: string;
  image: string;
  label: string;
  prompt: string;
  model: "Qwen" | "Seedream4";
  ratio: string;
  resolution?: "2K" | "4K";
}

export interface ImageEditItem {
  id: string;
  before: string;
  after: string;
  label: string;
  prompt: string;
  technique: "Flux Kontext" | "Seedream4 Edit" | "Nano Banana" | "Qwen Edit Plus" | "Background Remove";
  isBackgroundRemove?: boolean;
}

export interface Text3DItem {
  id: string;
  thumbnail: string;
  glb: string;
  label: string;
  prompt: string;
  specs: string;
}

export interface Image3DItem {
  id: string;
  thumbnail: string;
  glb: string;
  label: string;
  prompt: string;
  specs: string;
  srcThumb?: string;
}

// ── TAB 1: Image Generation (14) ──────────────────────────────
export const imageGenItems: ImageGenItem[] = [
  { id: "ig-1", image: `${BASE}/image-generation/seedream4_1773224832_seedream4_1773224812_0_.png`, label: "Alice in Wonderland — White Rabbit", prompt: "A frantic White Rabbit from Alice in Wonderland, in a vibrant whimsical garden with bioluminescent mushrooms and floating teacups", model: "Seedream4", ratio: "4:3", resolution: "2K" },
  { id: "ig-2", image: `${BASE}/image-generation/seedream4_1773652726_seedream4_1773652705_0_.png`, label: "Orbital Space Station", prompt: "A colossal orbital space station, advanced modular construction, cinematic long shot, ultra wide-angle, advanced ray tracing, studio-grade photorealism", model: "Seedream4", ratio: "21:9", resolution: "4K" },
  { id: "ig-3", image: `${BASE}/image-generation/qwen_1768213196_qwen_1768213190_0_.png`, label: "Sci-Fi Weapon Concept", prompt: "A sleek futuristic sci-fi gun with metallic finish, glowing blue energy conduits, presented in side profile view, dramatic cinematic lighting", model: "Qwen", ratio: "16:9" },
  { id: "ig-4", image: `${BASE}/image-generation/seedream4_1768215287_seedream4_1768215256_0_.png`, label: "Pixar Whimsical House", prompt: "A charming whimsical house in the enchanting vibrant 3D animation style of Pixar. Playful architecture, rounded edges, colorful roof, bright cheerful lighting, sunny day", model: "Seedream4", ratio: "1:1", resolution: "2K" },
  { id: "ig-5", image: `${BASE}/image-generation/qwen_1768215150_qwen_1768215135_0_.png`, label: "Hyper-Realistic Red Rose", prompt: "A hyper-realistic close-up of a single perfect red rose, velvety petals glistening with morning dew drops, soft blurred garden background, warm gentle lighting", model: "Qwen", ratio: "1:1" },
  { id: "ig-6", image: `${BASE}/image-generation/seedream4_1768215481_seedream4_1768215450_0_.png`, label: "Medieval Town Square", prompt: "A bustling medieval town square with cobblestone streets, half-timbered houses, a central fountain, and townspeople in period attire. Detailed realistic style, warm afternoon lighting", model: "Seedream4", ratio: "16:9", resolution: "2K" },
  { id: "ig-7", image: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png`, label: "Ruby Gemstone Macro", prompt: "A magnificent large oval-cut ruby gemstone, deep crimson red, sparkling with internal fire, studio lighting, macro photography, on a black velvet background", model: "Qwen", ratio: "1:1" },
  { id: "ig-8", image: `${BASE}/image-generation/qwen_1768215093_qwen_1768215068_0_.png`, label: "White Daisy Close-up", prompt: "A stunning close-up of a white daisy flower with a vibrant yellow center, detailed petals with gentle morning dew drops. Soft out-of-focus green field background, soft natural lighting", model: "Qwen", ratio: "1:1" },
  { id: "ig-9", image: `${BASE}/image-generation/qwen_1768237268_qwen_1768237245_0_.png`, label: "City Fireworks Display", prompt: "A spectacular fireworks display over a modern city skyline at night. Vibrant multi-colored explosions of light illuminate the dark sky. Dramatic high-quality photograph", model: "Qwen", ratio: "16:9" },
  { id: "ig-10", image: `${BASE}/image-generation/seedream4_1768219917_seedream4_1768219894_0_.png`, label: "Cute Cat Portrait", prompt: "A cute cat, high quality, detailed fur texture, soft studio lighting", model: "Seedream4", ratio: "1:1", resolution: "2K" },
  { id: "ig-11", image: `${BASE}/image-generation/qwen_1768218292_qwen_1768218253_0_.png`, label: "Triple-Scoop Ice Cream", prompt: "A delicious ice cream cone with three scoops of different flavors — strawberry, chocolate, and vanilla — with sprinkles and a cherry on top, against a bright cheerful background", model: "Qwen", ratio: "1:1" },
  { id: "ig-12", image: `${BASE}/image-generation/qwen_1768218605_qwen_1768218585_0_.png`, label: "Ceramic Bowl with Berries", prompt: "A beautifully crafted ceramic bowl filled with fresh colorful berries, sitting on a rustic wooden table. Soft natural lighting highlighting the textures of the bowl and the fruit", model: "Qwen", ratio: "1:1" },
  { id: "ig-13", image: `${BASE}/image-generation/qwen_1773637293_qwen_1773637288_0_.png`, label: "Vibrant Red Rose — Macro", prompt: "A vibrant red rose in full bloom, its velvety petals unfurling elegantly, delicate dewdrops clinging to each surface. Hyperrealistic nature photography, macro lens, UHD 8K", model: "Qwen", ratio: "4:3" },
  { id: "ig-14", image: `${BASE}/image-generation/seedream4_1773214132_seedream4_1773214122_0_.png`, label: "Deep Red Rose — Golden Hour", prompt: "Close-up shot, a vibrant delicate deep red rose in full bloom, glistening dew drops, sun-drenched garden, bokeh lights background, macro, hyper realistic, UHD 8K", model: "Seedream4", ratio: "4:3", resolution: "2K" },
];

// ── TAB 2: Image Editing (12) ─────────────────────────────────
export const imageEditItems: ImageEditItem[] = [
  { id: "ie-1", before: `${BASE}/image-generation/qwen_1768247733_qwen_1768247702_0_.png`, after: `${BASE}/image-editing/Seedream4Edit_output_1768248154_seedream4_1768248135_edit_20260113_010215_0c0fb1f3_.png`, technique: "Seedream4 Edit", label: "Apple → Metallic Gold", prompt: "Change the apple into an object made of polished, shining, metallic gold." },
  { id: "ie-2", before: `${BASE}/image-editing/Seedream4Edit_output_1768248154_seedream4_1768248135_edit_20260113_010215_0c0fb1f3_.png`, after: `${BASE}/image-editing/Seedream4Edit_output_1768248220_seedream4_1768248202_edit_20260113_010322_be2d98fc_.png`, technique: "Seedream4 Edit", label: "Gold Apple → Polished Silver", prompt: "Change the metallic golden apple into a polished, shining silver apple." },
  { id: "ie-3", before: `${BASE}/image-editing/NanoBananaEdit_input_1_1768216656_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`, after: `${BASE}/image-editing/NanoBananaEdit_output_1768216696_nano_banana_1768216656_edit_20260112_161736_2cfc67ee_.png`, technique: "Nano Banana", label: "Bowl → Make It Black", prompt: "make it black" },
  { id: "ie-4", before: `${BASE}/image-editing/NanoBananaEdit_input_1_1768258834_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`, after: `${BASE}/image-editing/flux_kotext_output_1768258790_flux_kontext_1768258773_edit_20260113_035933_bfb7006e.png`, technique: "Flux Kontext", label: "Basket Apples → Golden", prompt: "change all the apples in the basket to be golden" },
  { id: "ie-5", before: `${BASE}/image-editing/NanoBananaEdit_input_1_1768258834_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`, after: `${BASE}/image-editing/NanoBananaEdit_output_1768258850_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`, technique: "Nano Banana", label: "Golden → Silver Apple Mix", prompt: "make some of the golden apples silver" },
  { id: "ie-6", before: `${BASE}/image-editing/NanoBananaEdit_output_1768258850_nano_banana_1768258834_edit_20260113_040034_61f80daa_.png`, after: `${BASE}/image-editing/Seedream4Edit_output_1768258910_seedream4_1768258900_edit_20260113_040140_06d9b7eb_.png`, technique: "Seedream4 Edit", label: "Silver → Bronze Apples", prompt: "make a few of the silver apples bronze" },
  { id: "ie-7", before: `${BASE}/image-editing/Seedream4Edit_output_1768248220_seedream4_1768248202_edit_20260113_010322_be2d98fc_.png`, after: `${BASE}/image-editing/flux_kotext_output_1768248309_flux_kontext_1768248290_edit_20260113_010450_5bf87c85.png`, technique: "Flux Kontext", label: "Silver Apple → Bronze", prompt: "Change the silver apple into a polished, shining bronze apple." },
  { id: "ie-8", before: `${BASE}/image-editing/flux_kotext_output_1768248309_flux_kontext_1768248290_edit_20260113_010450_5bf87c85.png`, after: `${BASE}/image-editing/flux_kotext_output_1768248371_flux_kontext_1768248353_edit_20260113_010553_6e6c06ce.png`, technique: "Flux Kontext", label: "Bronze → Silver Apple", prompt: "Change the bronze apple into a polished, shining silver apple." },
  { id: "ie-9", before: `${BASE}/image-generation/qwen_1772731925_qwen_1772731920_0_.png`, after: `${BASE}/image-editing/qwen_edit_plus_1772740976_output_qwen_edit_plus_1772740970_edit_20260306_010250_c64600be.png`, technique: "Qwen Edit Plus", label: "Text Edit: 'cake mania' → 'you win'", prompt: "change the text from 'cake mania' to 'you win'" },
  { id: "ie-10", before: `${BASE}/image-editing/BackgroundRemove_input_1772738025_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa.png`, after: `${BASE}/image-editing/BackgroundRemove_output_1772738042_bg_remove_1772738025_edit_20260306_001345_e9b6dbaa_.png`, technique: "Background Remove", label: "Background Removal #1", prompt: "One-click clean background removal — transparent PNG output", isBackgroundRemove: true },
  { id: "ie-11", before: `${BASE}/image-editing/BackgroundRemove_input_1772738062_bg_remove_1772738062_edit_20260306_001422_7419b775.png`, after: `${BASE}/image-editing/BackgroundRemove_output_1772738091_bg_remove_1772738062_edit_20260306_001422_7419b775_.png`, technique: "Background Remove", label: "Background Removal #2", prompt: "One-click clean background removal — transparent PNG output", isBackgroundRemove: true },
  { id: "ie-12", before: `${BASE}/image-editing/BackgroundRemove_input_1772738204_bg_remove_1772738204_edit_20260306_001644_a0373b05.png`, after: `${BASE}/image-editing/BackgroundRemove_output_1772738213_bg_remove_1772738204_edit_20260306_001644_a0373b05_.png`, technique: "Background Remove", label: "Background Removal #3", prompt: "One-click clean background removal — transparent PNG output", isBackgroundRemove: true },
];

// ── TAB 3: Text → 3D (9) ─────────────────────────────────────
export const text3DItems: Text3DItem[] = [
  { id: "t3d-1", thumbnail: `${BASE}/model-images/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.webp`, glb: `${BASE}/models/f2bd1b48-575f-49db-ac17-5bb00b12f6b8.glb`, label: "Fantasy Warrior", prompt: "A battle-worn fantasy warrior, heavy plate armor with runes, dark fantasy style", specs: "midpoly · PBR · detailed quality" },
  { id: "t3d-2", thumbnail: `${BASE}/model-images/f60be5ee-916e-469d-b24a-56bbba28881c.webp`, glb: `${BASE}/models/f60be5ee-916e-469d-b24a-56bbba28881c.glb`, label: "Fantasy Warrior — 4K Detail", prompt: "A battle-worn fantasy warrior, heavy plate armor with runes, dark fantasy style, 4K detail", specs: "midpoly · PBR · standard quality" },
  { id: "t3d-3", thumbnail: `${BASE}/model-images/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.webp`, glb: `${BASE}/models/f7ccdd9c-4640-4c31-a21f-33d9ca3bdc50.glb`, label: "Sci-Fi Space Rocket", prompt: "scifi space rocket", specs: "midpoly · PBR" },
  { id: "t3d-4", thumbnail: `${BASE}/model-images/a1d2e333-5d57-4477-9be7-08128dc5b6a1.webp`, glb: `${BASE}/models/a1d2e333-5d57-4477-9be7-08128dc5b6a1.glb`, label: "Spaceship", prompt: "spaceship", specs: "midpoly · PBR" },
  { id: "t3d-5", thumbnail: `${BASE}/model-images/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.webp`, glb: `${BASE}/models/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.glb`, label: "Bicycle", prompt: "a 3D model of a bicycle", specs: "midpoly · PBR" },
  { id: "t3d-6", thumbnail: `${BASE}/model-images/ff623697-ecb1-4ae7-989e-7a09dd2478b9.webp`, glb: `${BASE}/models/ff623697-ecb1-4ae7-989e-7a09dd2478b9.glb`, label: "Wicker Basket", prompt: "a basket", specs: "midpoly · PBR" },
  { id: "t3d-7", thumbnail: `${BASE}/model-images/7e6348c7-d114-426a-af03-04f7ead90e17.webp`, glb: `${BASE}/models/7e6348c7-d114-426a-af03-04f7ead90e17.glb`, label: "Mirror", prompt: "a mirror", specs: "lowpoly · PBR" },
  { id: "t3d-8", thumbnail: `${BASE}/model-images/3ad22dd6-e10d-4bec-b76e-f6b3a62e0bfd.webp`, glb: `${BASE}/models/3ad22dd6-e10d-4bec-b76e-f6b3a62e0bfd.glb`, label: "Cat", prompt: "A cat", specs: "midpoly · PBR" },
  { id: "t3d-9", thumbnail: `${BASE}/model-images/792a23c5-69f1-4556-8cff-135374a0a2ac.webp`, glb: `${BASE}/models/792a23c5-69f1-4556-8cff-135374a0a2ac.glb`, label: "Cat — v2", prompt: "cat", specs: "midpoly · PBR" },
];

// ── TAB 4: Image → 3D (12) ───────────────────────────────────
export const image3DItems: Image3DItem[] = [
  { id: "i3d-1", thumbnail: `${BASE}/model-images/c50accb3-c2c7-486e-a86e-3b1c86033b2f.webp`, glb: `${BASE}/models/c50accb3-c2c7-486e-a86e-3b1c86033b2f.glb`, label: "Image → 3D — Ruby Gemstone", prompt: "Source: Ruby gemstone macro photo converted to full 3D GLB model", specs: "midpoly · PBR", srcThumb: `${BASE}/image-generation/qwen_1768218108_qwen_1768218072_0_.png` },
  { id: "i3d-2", thumbnail: `${BASE}/model-images/9a39de7b-4908-4952-a613-72ca3568596a.webp`, glb: `${BASE}/models/9a39de7b-4908-4952-a613-72ca3568596a.glb`, label: "Image → 3D — Object #2", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-3", thumbnail: `${BASE}/model-images/f1681708-6674-42b5-9aee-0948852cf0aa.webp`, glb: `${BASE}/models/f1681708-6674-42b5-9aee-0948852cf0aa.glb`, label: "Image → 3D — Object #3", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-4", thumbnail: `${BASE}/model-images/4225f675-5da1-4773-9b6d-8e9b839eab4d.webp`, glb: `${BASE}/models/4225f675-5da1-4773-9b6d-8e9b839eab4d.glb`, label: "Image → 3D — Object #4", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-5", thumbnail: `${BASE}/model-images/9a4ca67a-ba62-41f3-b446-664381b3b484.webp`, glb: `${BASE}/models/9a4ca67a-ba62-41f3-b446-664381b3b484.glb`, label: "Image → 3D — Object #5", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-6", thumbnail: `${BASE}/model-images/33d8b7bb-5e94-406a-bef2-89405d3ce56e.webp`, glb: `${BASE}/models/33d8b7bb-5e94-406a-bef2-89405d3ce56e.glb`, label: "Image → 3D — Object #6", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-7", thumbnail: `${BASE}/model-images/f4346407-98f1-45a7-a86e-360cd84ffc31.webp`, glb: `${BASE}/models/f4346407-98f1-45a7-a86e-360cd84ffc31.glb`, label: "Image → 3D — Object #7", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-8", thumbnail: `${BASE}/model-images/f731d228-79ce-4a64-8192-2463939b7ea1.webp`, glb: `${BASE}/models/f731d228-79ce-4a64-8192-2463939b7ea1.glb`, label: "Image → 3D — Object #8", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-9", thumbnail: `${BASE}/model-images/5d59c061-48f3-4237-b3ff-2a09b9dde131.webp`, glb: `${BASE}/models/5d59c061-48f3-4237-b3ff-2a09b9dde131.glb`, label: "Image → 3D — Object #9", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-10", thumbnail: `${BASE}/model-images/26fe8436-761a-4935-8c60-092654b64c01.webp`, glb: `${BASE}/models/26fe8436-761a-4935-8c60-092654b64c01.glb`, label: "Image → 3D — Object #10", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-11", thumbnail: `${BASE}/model-images/0d65f56e-9208-4b63-a655-ffec57049c45.webp`, glb: `${BASE}/models/0d65f56e-9208-4b63-a655-ffec57049c45.glb`, label: "Image → 3D — Object #11", prompt: "Photo-based 3D reconstruction with PBR textures and midpoly mesh", specs: "midpoly · PBR" },
  { id: "i3d-12", thumbnail: `${BASE}/model-images/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.webp`, glb: `${BASE}/models/e8e35c9f-54c7-4fd5-85f6-fd3958257f7d.glb`, label: "Image → 3D — Object #12", prompt: "Photo-based 3D reconstruction from uploaded source image, PBR textured midpoly mesh", specs: "midpoly · PBR", srcThumb: `${BASE}/image-generation/qwen_1768215150_qwen_1768215135_0_.png` },
];

// ── Legacy exports for backward compatibility ─────────────────
export type ImageEditExample = ImageEditItem;
export const imageEditExamples = imageEditItems;
