import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

// Curated gallery collection
const galleryImages = [
  "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=750&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=700&fit=crop",
  "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=750&fit=crop",
];

// Exhibition pieces for carousel
const exhibitionPieces = [
  { image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop", title: "Genesis", medium: "AI Generation" },
  { image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop", title: "Metamorphosis", medium: "Image Editing" },
  { image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&h=600&fit=crop", title: "Dimension", medium: "3D Creation" },
  { image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=600&fit=crop", title: "Flux", medium: "Optimization" },
  { image: "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=800&h=600&fit=crop", title: "Reverie", medium: "Concept Art" },
  { image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=600&fit=crop", title: "Isolation", medium: "Background Removal" },
];

const pricingTiers = [
  {
    name: "Collector",
    price: "$19",
    period: "/month",
    description: "For individual creators",
    features: ["100 image generations", "50 3D models", "Basic editing tools", "Email support"],
  },
  {
    name: "Artist",
    price: "$49",
    period: "/month",
    description: "For creative professionals",
    features: ["Unlimited generations", "Unlimited 3D models", "Advanced editing", "Priority support", "API access"],
    popular: true,
  },
  {
    name: "Studio",
    price: "$199",
    period: "/month",
    description: "For teams and studios",
    features: ["Everything in Artist", "Team collaboration", "Custom models", "Dedicated support", "SLA guarantee"],
  },
];

// Image arrays for cycling in feature sections
const imageGenerationImages = [
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop",
];

const imageEditingImages = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop",
];

// Gallery sections content
const galleryExhibits = [
  {
    id: "generation",
    label: "Gallery I",
    title: "Image Generation",
    description: "Create stunning visuals from pure imagination. Our AI understands artistic intent, translating your vision into photorealistic renders, stylized illustrations, and everything in between.",
  },
  {
    id: "editing",
    label: "Gallery II",
    title: "Image Editing",
    description: "Transform and refine with precision. Remove backgrounds instantly, upscale to crystalline clarity, enhance every detail—your canvas awaits.",
  },
  {
    id: "3d",
    label: "Gallery III",
    title: "3D Model Generation",
    description: "Sculpt dimensions from words. Generate production-ready 3D assets, optimize topology, and export for any creative pipeline.",
    image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&h=600&fit=crop",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [imageGenIndex, setImageGenIndex] = useState(0);
  const [imageEditIndex, setImageEditIndex] = useState(0);
  const [isImageGenHovered, setIsImageGenHovered] = useState(false);
  const [isImageEditHovered, setIsImageEditHovered] = useState(false);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  // Slow hero image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through images only when hovering
  useEffect(() => {
    if (!isImageGenHovered) return;
    const interval = setInterval(() => {
      setImageGenIndex((prev) => (prev + 1) % imageGenerationImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isImageGenHovered]);

  useEffect(() => {
    if (!isImageEditHovered) return;
    const interval = setInterval(() => {
      setImageEditIndex((prev) => (prev + 1) % imageEditingImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isImageEditHovered]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Refined Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-medium tracking-tight">Game AI Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Button 
              onClick={() => navigate("/app")} 
              variant="outline"
              className="gap-2 px-6 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Enter Gallery
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Gallery Entrance */}
      <section className="relative min-h-screen pt-20 flex items-center">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="gallery-label mb-4 block">Welcome to the Exhibition</span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.95] mb-8 tracking-tight">
              Where AI
              <br />
              <span className="italic">Meets Artistry</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
              Step into a curated experience of AI-powered creation. Generate visuals, 
              sculpt dimensions, and transform your imagination into masterpieces.
            </p>
            <div className="flex items-center gap-6">
              <Button 
                size="lg" 
                onClick={() => navigate("/app")} 
                className="text-lg px-8 py-6 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
              >
                Begin Creating
              </Button>
              <span className="text-sm text-muted-foreground">Free to explore</span>
            </div>
          </motion.div>

          {/* Featured Artwork with Frame */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            <div className="gallery-frame gallery-spotlight">
              <div className="gallery-frame-inner aspect-[4/5]">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={heroImageIndex}
                    src={galleryImages[heroImageIndex]}
                    alt="Featured artwork"
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1.05,
                      transition: {
                        opacity: { duration: 1, ease: "easeOut" },
                        scale: { duration: 6, ease: "linear" }
                      }
                    }}
                    exit={{ 
                      opacity: 0,
                      transition: { duration: 1, ease: "easeIn" }
                    }}
                  />
                </AnimatePresence>
              </div>
            </div>
            {/* Museum-style label */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-6 text-center"
            >
              <p className="gallery-title text-lg italic text-foreground/80">Untitled No. {heroImageIndex + 1}</p>
              <p className="gallery-label mt-1">AI on Digital Canvas, 2024</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Exhibits - Feature Sections */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-8 space-y-40">
          
          {/* Gallery I - Image Generation */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="grid lg:grid-cols-2 gap-16 items-center"
            onMouseEnter={() => setIsImageGenHovered(true)}
            onMouseLeave={() => setIsImageGenHovered(false)}
          >
            <div className="gallery-frame gallery-spotlight">
              <div className="gallery-frame-inner aspect-[4/3]">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={imageGenIndex}
                    src={imageGenerationImages[imageGenIndex]}
                    alt={galleryExhibits[0].title}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1.08,
                      transition: {
                        opacity: { duration: 0.6, ease: "easeOut" },
                        scale: { duration: 4, ease: "linear" }
                      }
                    }}
                    exit={{ 
                      opacity: 0,
                      transition: { duration: 0.6, ease: "easeIn" }
                    }}
                  />
                </AnimatePresence>
              </div>
            </div>
            <div className="lg:pl-8">
              <span className="gallery-label block mb-4">{galleryExhibits[0].label}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-6 tracking-tight">
                {galleryExhibits[0].title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                {galleryExhibits[0].description}
              </p>
            </div>
          </motion.div>

          {/* Gallery II - Image Editing */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="grid lg:grid-cols-2 gap-16 items-center"
            onMouseEnter={() => setIsImageEditHovered(true)}
            onMouseLeave={() => setIsImageEditHovered(false)}
          >
            <div className="lg:pr-8 order-2 lg:order-1">
              <span className="gallery-label block mb-4">{galleryExhibits[1].label}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-6 tracking-tight">
                {galleryExhibits[1].title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                {galleryExhibits[1].description}
              </p>
            </div>
            <div className="gallery-frame gallery-spotlight order-1 lg:order-2">
              <div className="gallery-frame-inner aspect-[4/3]">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={imageEditIndex}
                    src={imageEditingImages[imageEditIndex]}
                    alt={galleryExhibits[1].title}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1.08,
                      transition: {
                        opacity: { duration: 0.6, ease: "easeOut" },
                        scale: { duration: 4, ease: "linear" }
                      }
                    }}
                    exit={{ 
                      opacity: 0,
                      transition: { duration: 0.6, ease: "easeIn" }
                    }}
                  />
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Gallery III - 3D Generation */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div className="gallery-frame gallery-spotlight">
              <div className="gallery-frame-inner aspect-[4/3]">
                <motion.img
                  src={galleryExhibits[2].image}
                  alt={galleryExhibits[2].title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
            <div className="lg:pl-8">
              <span className="gallery-label block mb-4">{galleryExhibits[2].label}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-6 tracking-tight">
                {galleryExhibits[2].title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                {galleryExhibits[2].description}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Exhibition Carousel */}
      <section className="py-32 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="gallery-label block mb-4">The Collection</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
              Explore the Exhibition
            </h2>
          </motion.div>

          <div 
            className="overflow-hidden -mx-8 px-8"
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
          >
            <div
              className="flex gap-8 animate-scroll-left"
              style={{ 
                width: "fit-content",
                animationPlayState: isCarouselHovered ? "paused" : "running"
              }}
            >
              {[...exhibitionPieces, ...exhibitionPieces].map((piece, index) => (
                <motion.div 
                  key={index} 
                  className="flex-shrink-0 w-[320px] md:w-[380px]"
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="gallery-frame gallery-spotlight cursor-pointer">
                    <div className="gallery-frame-inner aspect-[4/3]">
                      <img
                        src={piece.image}
                        alt={piece.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="gallery-title text-lg italic">{piece.title}</p>
                    <p className="gallery-label mt-1">{piece.medium}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-32 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="gallery-label block mb-4">Membership</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
              Join the Gallery
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative p-10 transition-all duration-500 ${
                  tier.popular
                    ? "bg-foreground text-background"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-background text-foreground text-xs gallery-label">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-medium mb-2">{tier.name}</h3>
                  <p className={`text-sm ${tier.popular ? "text-background/70" : "text-muted-foreground"}`}>
                    {tier.description}
                  </p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-medium">{tier.price}</span>
                  <span className={`text-sm ${tier.popular ? "text-background/70" : "text-muted-foreground"}`}>
                    {tier.period}
                  </span>
                </div>
                <ul className="space-y-4 mb-10">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${tier.popular ? "text-background" : "text-foreground"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate("/app")}
                  variant={tier.popular ? "secondary" : "outline"}
                  className={`w-full ${!tier.popular && "border-foreground/20 hover:bg-foreground hover:text-background"}`}
                >
                  Select Plan
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl font-medium">Game AI Studio</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Game AI Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;