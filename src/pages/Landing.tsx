import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

// Artwork images for masonry background - using diverse AI art styles
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

      {/* Hero Section with Masonry Background */}
      <section className="relative min-h-screen pt-16 overflow-hidden">
        {/* Masonry Background */}
        <div className="absolute inset-0 flex gap-3 px-3 opacity-[0.38]">
          {artworkColumns.map((column, colIndex) => (
            <div
              key={colIndex}
              className="flex-1 flex flex-col gap-3"
            >
              <motion.div
                className="flex flex-col gap-3"
                animate={{
                  y: colIndex % 2 === 0 ? [0, -1000] : [-1000, 0],
                }}
                transition={{
                  y: {
                    duration: 30 + colIndex * 5,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
              >
                {/* Duplicate images for seamless loop */}
                {[...column, ...column, ...column].map((src, imgIndex) => (
                  <div
                    key={imgIndex}
                    className="relative rounded-xl overflow-hidden bg-muted shadow-lg"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Gradient Overlays - lighter for more visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background/90 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Your Imagination,{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Supercharged by AI
                </span>
              </h1>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="px-5 py-2.5 rounded-full bg-background/40 border border-primary/20 backdrop-blur-md shadow-lg">
                  <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent inline-flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Powered by The Agent Engine
                  </span>
                </div>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
                AI for production-ready visuals and 3D assets.
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
          </div>
        </div>
      </section>

      {/* Feature Sections - Alternating Layout */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          {/* Image Generation - Image Left, Text Right */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border bg-muted shadow-xl">
              <img
                src={storyContent[0].image}
                alt={storyContent[0].title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            <div className="text-center md:text-left">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                {storyContent[0].subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {storyContent[0].title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {storyContent[0].description}
              </p>
            </div>
          </motion.div>

          {/* Image Editing - Text Left, Image Right */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="text-center md:text-left order-2 md:order-1">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                {storyContent[1].subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {storyContent[1].title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {storyContent[1].description}
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border bg-muted shadow-xl order-1 md:order-2">
              <img
                src={storyContent[1].image}
                alt={storyContent[1].title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
          </motion.div>

          {/* 3D Model Generation - Image Left, Text Right */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border bg-muted shadow-xl">
              <img
                src={storyContent[2].image}
                alt={storyContent[2].title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            <div className="text-center md:text-left">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                {storyContent[2].subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {storyContent[2].title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {storyContent[2].description}
              </p>
            </div>
          </motion.div>
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
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="inline-block px-4 py-2 bg-background/50 border border-primary/20 text-foreground text-sm font-medium rounded-full backdrop-blur-md shadow-lg [text-shadow:0_0_10px_hsl(var(--primary)/0.5),0_0_20px_hsl(var(--primary)/0.3)]">
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
