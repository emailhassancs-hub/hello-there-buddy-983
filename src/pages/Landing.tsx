import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Sparkles, 
  Image, 
  Wand2, 
  Eraser, 
  ZoomIn, 
  Box, 
  Settings2,
  ArrowRight,
  Check,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Demo images for hero carousel
const carouselImages = [
  "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=400&fit=crop",
];

// Workflow carousel items
const workflowItems = [
  {
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
    label: "Image Generation",
  },
  {
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop",
    label: "Image Editing",
  },
  {
    image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&h=600&fit=crop",
    label: "3D Creation",
  },
  {
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=600&fit=crop",
    label: "Asset Optimization",
  },
  {
    image: "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=800&h=600&fit=crop",
    label: "Concept Art",
  },
  {
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=600&fit=crop",
    label: "Background Removal",
  },
];

const tools = [
  { icon: Image, label: "Image Generation", description: "Create stunning visuals from text" },
  { icon: Wand2, label: "Image Editing", description: "Transform and enhance images" },
  { icon: Eraser, label: "Background Removal", description: "Clean, precise cutouts" },
  { icon: ZoomIn, label: "Image Upscaling", description: "Enhance resolution 4x" },
  { icon: Box, label: "3D Generation", description: "Text to 3D models" },
  { icon: Settings2, label: "3D Optimization", description: "Production-ready assets" },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "Perfect for individuals",
    features: ["100 image generations", "50 3D models", "Basic editing tools", "Email support"],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For creative professionals",
    features: ["Unlimited generations", "Unlimited 3D models", "Advanced editing", "Priority support", "API access"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For teams and studios",
    features: ["Everything in Pro", "Team collaboration", "Custom models", "Dedicated support", "SLA guarantee"],
  },
];

// Scrollable storytelling content
const storyContent = [
  {
    id: "image-generation",
    title: "Image Generation",
    subtitle: "Infinite Styles, Endless Possibilities",
    description: "Generate concept art, characters, environments, and marketing visuals in any style. From photorealistic renders to stylized illustrations, our AI adapts to your creative vision and brings ideas to life instantly.",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
  },
  {
    id: "image-editing",
    title: "Image Editing",
    subtitle: "Transform & Enhance",
    description: "Edit images with precision using AI-powered tools. Remove backgrounds instantly, upscale to 4x resolution, enhance details, and apply visual effects — all with simple commands.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop",
  },
  {
    id: "3d-generation",
    title: "3D Model Generation & Optimization",
    subtitle: "Production-Ready 3D Assets",
    description: "Create and optimize 3D models for games and creative projects. Generate from text or images, optimize topology, create textures, and export production-ready assets for any game engine.",
    image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&h=600&fit=crop",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Update active story based on scroll position within the section
  useEffect(() => {
    const handleScroll = () => {
      if (!storyRef.current) return;
      
      const rect = storyRef.current.getBoundingClientRect();
      const sectionHeight = storyRef.current.offsetHeight;
      const viewportTop = -rect.top;
      const sectionCount = storyContent.length;
      
      // Calculate progress through the section (0 to 1)
      const progress = Math.max(0, Math.min(1, viewportTop / (sectionHeight - window.innerHeight)));
      
      // Map progress to section index
      const newIndex = Math.min(
        Math.floor(progress * sectionCount),
        sectionCount - 1
      );
      
      setActiveStoryIndex(Math.max(0, newIndex));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">Game AI Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              onClick={() => navigate("/app")}
              className="gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Your Imagination,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Supercharged by AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Powered by{" "}
              <span className="text-foreground font-semibold inline-flex items-center gap-1">
                <Zap className="w-5 h-5 text-primary" />
                The Agent Engine
              </span>{" "}
              — AI for production-ready visuals and 3D assets.
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              The core intelligence that powers every creative workflow in Game AI Studio.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/app")}
              className="text-lg px-8 py-6 gap-2"
            >
              Start Creating
              <Sparkles className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Auto-playing Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {carouselImages.map((src, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-border bg-muted">
                      <img 
                        src={src} 
                        alt={`AI Generated ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </motion.div>
        </div>
      </section>

      {/* Scrollable Storytelling Section */}
      <section 
        ref={storyRef} 
        className="relative"
        style={{ height: `${storyContent.length * 100}vh` }}
      >
        <div className="sticky top-16 h-[calc(100vh-4rem)] flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Fixed Image Frame */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border bg-muted shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={storyContent[activeStoryIndex].id}
                    src={storyContent[activeStoryIndex].image}
                    alt={storyContent[activeStoryIndex].title}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                
                {/* Progress indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {storyContent.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === activeStoryIndex 
                          ? "bg-primary w-8" 
                          : "bg-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Animated Text Content */}
              <div className="text-center md:text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={storyContent[activeStoryIndex].id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="text-sm font-medium text-primary uppercase tracking-wider">
                      {storyContent[activeStoryIndex].subtitle}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-6">
                      {storyContent[activeStoryIndex].title}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                      {storyContent[activeStoryIndex].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Carousel Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Try Different Workflows</h2>
            <p className="text-xl text-muted-foreground">Explore the creative possibilities</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 2500, stopOnInteraction: false })]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {workflowItems.map((item, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-background group cursor-pointer">
                      <img 
                        src={item.image} 
                        alt={item.label}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="inline-block px-3 py-1.5 bg-primary/90 text-primary-foreground text-sm font-medium rounded-full backdrop-blur-sm">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </motion.div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
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
                className="group p-6 bg-background border border-border rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
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

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground">Choose the plan that fits your needs</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  tier.popular 
                    ? "bg-primary text-primary-foreground border-primary scale-105" 
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-background text-foreground text-sm font-medium rounded-full border border-border">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className={tier.popular ? "text-primary-foreground/80" : "text-muted-foreground"}>
                    {tier.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  <span className={tier.popular ? "text-primary-foreground/80" : "text-muted-foreground"}>
                    {tier.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${tier.popular ? "text-primary-foreground" : "text-primary"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate("/app")}
                  variant={tier.popular ? "secondary" : "default"}
                  className="w-full"
                >
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">Game AI Studio</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Game AI Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
