import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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
  Play,
  Star,
  Zap,
  Layers,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Demo images for carousel
const carouselImages = [
  "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop",
];

const tools = [
  { icon: Image, label: "Image Generation", description: "Create stunning visuals from text prompts", gradient: "from-violet-500 to-purple-600" },
  { icon: Wand2, label: "Image Editing", description: "Transform and enhance images with AI", gradient: "from-blue-500 to-cyan-500" },
  { icon: Eraser, label: "Background Removal", description: "Clean, pixel-perfect cutouts instantly", gradient: "from-emerald-500 to-teal-500" },
  { icon: ZoomIn, label: "Image Upscaling", description: "Enhance resolution up to 4x clarity", gradient: "from-orange-500 to-amber-500" },
  { icon: Box, label: "3D Generation", description: "Text to production-ready 3D models", gradient: "from-pink-500 to-rose-500" },
  { icon: Settings2, label: "3D Optimization", description: "Game-ready assets in seconds", gradient: "from-indigo-500 to-violet-500" },
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

const featureSections = [
  {
    id: "brainstorm",
    title: "Idea & Brainstorming",
    subtitle: "Ignite Your Creative Vision",
    description: "Transform rough concepts into polished ideas. Our AI understands your creative intent and generates inspiration that sparks innovation.",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop",
    icon: Palette,
    stats: [{ label: "Ideas Generated", value: "10M+" }],
  },
  {
    id: "text-to-image",
    title: "Text-to-Image Editing",
    subtitle: "Words Become Worlds",
    description: "Describe your vision in natural language. Watch as AI transforms your words into stunning, high-fidelity images with incredible detail.",
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=600&fit=crop",
    icon: Wand2,
    stats: [{ label: "Images Created", value: "50M+" }],
  },
  {
    id: "3d-generation",
    title: "3D Model Generation",
    subtitle: "From Flat to Fully Realized",
    description: "Convert 2D concepts into production-ready 3D models. Optimize topology, generate textures, and export for any game engine.",
    image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&h=600&fit=crop",
    icon: Box,
    stats: [{ label: "3D Models", value: "5M+" }],
  },
];

const stats = [
  { value: "50M+", label: "Images Created" },
  { value: "10K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "User Rating" },
];

// Floating orbs component
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse delay-500" />
  </div>
);

// Grid pattern component
const GridPattern = () => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]">
    <div 
      className="w-full h-full"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}
    />
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <Sparkles className="w-7 h-7 text-primary" />
              <div className="absolute inset-0 w-7 h-7 bg-primary/40 rounded-full blur-md" />
            </div>
            <span className="font-bold text-xl tracking-tight">Game AI Studio</span>
          </motion.div>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <a href="#tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tools</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </nav>
            <ThemeToggle />
            <Button 
              onClick={() => navigate("/app")}
              className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <FloatingOrbs />
        <GridPattern />
        
        <div className="max-w-7xl mx-auto relative">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Powered by cutting-edge AI</span>
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">New</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-[0.9]">
              Your Imagination,{" "}
              <br className="hidden md:block" />
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Supercharged by AI
                </span>
                <motion.span
                  className="absolute -inset-1 bg-primary/20 blur-2xl rounded-full"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              From stunning visuals to production-ready 3D models, our platform helps creative teams bring ideas to life faster than ever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/app")}
                className="text-lg px-8 py-6 gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
              >
                Start Creating Free
                <Sparkles className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 gap-2 hover:bg-muted/50"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="text-center p-4"
              >
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Auto-playing Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-3xl blur-2xl opacity-50" />
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 2500, stopOnInteraction: false })]}
              className="w-full relative"
            >
              <CarouselContent className="-ml-4">
                {carouselImages.map((src, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <motion.div 
                      className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-border/50 bg-muted group"
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img 
                        src={src} 
                        alt={`AI Generated ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">AI Generated</span>
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </motion.div>
        </div>
      </section>

      {/* Feature Sections with Scroll Effects */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative">
          {featureSections.map((feature, index) => (
            <FeatureSection key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50" />
        <FloatingOrbs />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm mb-4">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">All-in-one toolkit</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Powerful Tools</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Everything you need to create amazing content, all in one place</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-8 bg-background/80 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <tool.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{tool.label}</h3>
                <p className="text-muted-foreground leading-relaxed">{tool.description}</p>
                
                <div className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <GridPattern />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm mb-4">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Simple pricing</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Start free, upgrade when you're ready. No hidden fees.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-3xl border transition-all duration-500 ${
                  tier.popular 
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-2xl shadow-primary/30 scale-105 z-10" 
                    : "bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-xl"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-background text-foreground text-sm font-semibold rounded-full border border-border shadow-lg">
                    ✨ Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className={tier.popular ? "text-primary-foreground/80" : "text-muted-foreground"}>
                    {tier.description}
                  </p>
                </div>
                <div className="mb-8">
                  <span className="text-6xl font-bold tracking-tight">{tier.price}</span>
                  <span className={`text-lg ${tier.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {tier.period}
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${tier.popular ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                        <Check className={`w-3 h-3 ${tier.popular ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate("/app")}
                  variant={tier.popular ? "secondary" : "default"}
                  className={`w-full py-6 text-base font-semibold ${tier.popular ? "shadow-lg" : ""}`}
                >
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <FloatingOrbs />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Ready to Create Something{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Amazing?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of creators who are already using Game AI Studio to bring their ideas to life.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/app")}
              className="text-lg px-10 py-7 gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
            >
              Start Creating Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-primary" />
                <div className="absolute inset-0 w-6 h-6 bg-primary/40 rounded-full blur-md" />
              </div>
              <span className="font-bold text-lg">Game AI Studio</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
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

// Feature Section Component with scroll-triggered animations
const FeatureSection = ({ feature, index }: { feature: typeof featureSections[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, -80]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9]);

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="py-20 md:py-32"
    >
      <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-16`}>
        <motion.div 
          style={{ y, scale }}
          className="flex-1 w-full"
        >
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-border/50 bg-muted group">
            <img 
              src={feature.image}
              alt={feature.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            
            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full border border-border/50">
              <feature.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{feature.stats[0].value} {feature.stats[0].label}</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          style={{ y: useTransform(y, v => v * 0.3) }}
          className="flex-1 text-center md:text-left"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            <feature.icon className="w-4 h-4" />
            {feature.subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {feature.title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {feature.description}
          </p>
          <Button variant="outline" className="gap-2 group">
            Learn more
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Landing;
