import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Image, Wand2, Eraser, ZoomIn, Box, Settings2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const artworkColumns = [
  [
    "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=450&fit=crop",
    "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400&h=550&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=550&fit=crop",
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=450&fit=crop",
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=500&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=400&h=450&fit=crop",
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=550&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=450&fit=crop",
    "https://images.unsplash.com/photo-1573096108468-702f6014ef28?w=400&h=550&fit=crop",
    "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1569172122301-bc5008bc09c5?w=400&h=600&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1482160549825-59d1b23cb208?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=450&fit=crop",
    "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=550&fit=crop",
  ],
];

const workflowItems = [
  { image: "https://resources.rapidassets.ai/api/v1/image-editing/2d_prop.webp", label: "2D Prop Generation" },
  { image: "https://resources.rapidassets.ai/api/v1/image-editing/ColorChanger.webp", label: "Color Changer" },
  { image: "https://resources.rapidassets.ai/api/v1/image-editing/character_gen.webp", label: "Character Generation" },
  { image: "https://resources.rapidassets.ai/api/v1/image-editing/turnaround.webp", label: "Character Turnarounds" },
  { image: "https://resources.rapidassets.ai/api/v1/image-editing/sketch.webp", label: "Color Image" },
  { image: "https://resources.rapidassets.ai/api/v1/image-editing/ui.webp", label: "Design UI" },
];

const tools = [
  { icon: Image, label: "Image Generation", description: "Create stunning visuals from text" },
  { icon: Wand2, label: "Image Editing", description: "Transform and enhance images" },
  { icon: Eraser, label: "Background Removal", description: "Clean, precise cutouts" },
  { icon: ZoomIn, label: "Image Upscaling", description: "Enhance resolution 4x" },
  { icon: Box, label: "3D Generation", description: "Text to 3D models" },
  { icon: Settings2, label: "3D Optimization", description: "Production ready assets" },
];

const storyContent = [
  {
    title: "Image Generation",
    subtitle: "Infinite Styles, Endless Possibilities",
    description: "Generate concept art, characters, environments, and marketing visuals in any style. From photorealistic renders to stylized illustrations.",
    images: [
      "https://resources.rapidassets.ai/api/v1/image-editing/ship.webp?w=800&h=600&fit=crop",
      "https://resources.rapidassets.ai/api/v1/image-editing/alien.webp?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "Image Editing",
    subtitle: "Transform & Enhance",
    description: "Edit images with precision using AI-powered tools. Remove backgrounds instantly, upscale to 4x resolution, enhance details.",
    images: [
      "https://resources.rapidassets.ai/api/v1/image-editing/flying_cat.webp?w=800&h=600&fit=crop",
      "https://resources.rapidassets.ai/api/v1/image-editing/elf.webp?w=800&h=600&fit=crop",
    ],
  },
  {
    title: "3D Model Generation",
    subtitle: "Production Ready 3D Assets",
    description: "Create and optimize 3D models for games and creative projects. Generate from text or images, optimize topology, and export.",
    images: [
      "https://resources.rapidassets.ai/api/v1/image-editing/potion.webp?w=800&h=600&fit=crop",
      "https://resources.rapidassets.ai/api/v1/image-editing/hammer.webp?w=800&h=600&fit=crop",
    ],
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [demoPrompt, setDemoPrompt] = useState("");
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [imageIndices, setImageIndices] = useState([0, 0, 0]);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Image cycling on hover
  useEffect(() => {
    if (hoveredSection === null) return;
    const timeout = setTimeout(() => {
      setImageIndices((prev) => {
        const next = [...prev];
        next[hoveredSection] = (next[hoveredSection] + 1) % storyContent[hoveredSection].images.length;
        return next;
      });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [hoveredSection, imageIndices]);

  const handleDemoCreate = () => {
    // Per spec: clicking Create on landing opens auth modal / redirects to login
    if (demoPrompt.trim()) {
      navigate(`/login?demo_prompt=${encodeURIComponent(demoPrompt.trim())}`);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header — per spec: Logo left, Sign In + Get Started Free right */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">Rapid Assets</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="text-sm"
            >
              Sign In
            </Button>
            <Button onClick={() => navigate("/signup")} className="gap-2 text-sm">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section — per spec: "What do you want to create?" with demo prompt */}
      <section className="relative min-h-screen pt-16 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/landing-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <div className="max-w-3xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-10"
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
                What do you want to{" "}
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  create?
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                AI images, 3D models, and creative workflows — in one place.
              </p>
            </motion.div>

            {/* Demo prompt bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-card">
                <textarea
                  value={demoPrompt}
                  onChange={(e) => setDemoPrompt(e.target.value)}
                  placeholder="Try: a cinematic portrait of an astronaut at sunset"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                />
                <Button onClick={handleDemoCreate} className="shrink-0 gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          {storyContent.map((section, sIndex) => {
            const isReversed = sIndex % 2 !== 0;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="grid md:grid-cols-2 gap-12 items-center"
                onMouseEnter={() => setHoveredSection(sIndex)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-muted shadow-card ${isReversed ? "md:order-2" : ""}`}>
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={imageIndices[sIndex]}
                      src={section.images[imageIndices[sIndex]]}
                      alt={section.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, scale: 1.05, transition: { opacity: { duration: 0.6 }, scale: { duration: 4, ease: "linear" } } }}
                      exit={{ opacity: 0, transition: { duration: 0.6 } }}
                    />
                  </AnimatePresence>
                </div>
                <div className={`text-center md:text-left ${isReversed ? "md:order-1" : ""}`}>
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">{section.subtitle}</span>
                  <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{section.title}</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">{section.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Workflow Carousel */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Try Different Workflows</h2>
            <p className="text-xl text-muted-foreground">Explore the creative possibilities</p>
          </motion.div>

          <div className="overflow-hidden" onMouseEnter={() => setIsCarouselHovered(true)} onMouseLeave={() => setIsCarouselHovered(false)}>
            <div className="flex gap-4 animate-scroll-left" style={{ width: "fit-content", animationPlayState: isCarouselHovered ? "paused" : "running" }}>
              {[...workflowItems, ...workflowItems].map((item, index) => (
                <div key={index} className="flex-shrink-0 w-[280px] md:w-[320px]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card group cursor-pointer">
                    <img src={item.image} alt={item.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-block px-3 py-1.5 bg-card/80 text-foreground text-sm font-medium rounded-full backdrop-blur-md border border-border">
                        {item.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Tools</h2>
            <p className="text-xl text-muted-foreground">Everything you need to create amazing content</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <tool.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{tool.label}</h3>
                <p className="text-muted-foreground">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Start Creating Today</h2>
            <p className="text-xl text-muted-foreground mb-8">Free to start. No credit card required.</p>
            <Button size="lg" onClick={() => navigate("/signup")} className="text-lg px-8 py-6 gap-2">
              Get Started Free
              <Sparkles className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">Rapid Assets</span>
            </div>
            <p className="text-muted-foreground text-sm">© 2026 Rapid Assets. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
