import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import onboardingStep1 from "@/assets/onboarding-step1.jpg";
import onboardingStep2 from "@/assets/onboarding-step2.jpg";
import onboardingStep3 from "@/assets/onboarding-step3.jpg";

const steps = [
  {
    image:'https://resources.rapidassets.ai/api/v1/image-editing/onboard1.png',
    heading: "Generate Images with AI",
    description: "Type a prompt and watch AI bring your ideas to life. Create concept art, characters, environments, and props in seconds — all from a simple chat interface.",
  },
  {
    image:'https://resources.rapidassets.ai/api/v1/image-editing/onboard2.png',
    heading: "Edit & Enhance Instantly",
    description: "Refine your creations with powerful editing tools. Merge two or more images, change expressions and pose, remove backgrounds, adjust colors, upscale resolution, and apply style transfers.",
  },
  {
     image:'https://resources.rapidassets.ai/api/v1/image-editing/onboard3.png',
    heading: "Create Production-Ready 3D",
    description: "Create 3D models from text prompts or convert your 2D images into 3D assets ready for any game engine. Adjust topology, control polygon count, optimize, and export in industry-standard formats.",
  },
];

interface OnboardingModalProps {
  /** Whether server-side state says the user should see onboarding (e.g. hasSeenCreditsBonus === false) */
  shouldShow?: boolean;
  /** Called when the user finishes or closes onboarding so backend can be updated */
  onCompleted?: () => void | Promise<void>;
}

const OnboardingModal = ({ shouldShow = false, onCompleted }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  // Reset to first step when modal opens
  useEffect(() => {
    if (shouldShow) {
      setCurrentStep(0);
      setDirection(0);
    }
  }, [shouldShow]);

  if(!shouldShow) return null;

  const handleClose = () => {
    void onCompleted?.();
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };


  const step = steps[currentStep];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl border border-border bg-background text-foreground shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image area */}
        <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.img
              key={currentStep}
              src={step.image}
              alt={step.heading}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-6 pb-5">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-2">{step.heading}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Skip & Arrows */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClose}
              >
                Skip
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border/60"
                onClick={goPrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={goNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
