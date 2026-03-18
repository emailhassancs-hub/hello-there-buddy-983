import { motion } from "framer-motion";
import PromptBar from "./PromptBar";

const HeroSection = () => {
  return (
    <section className="py-12 md:py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-8"
      >
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
          What do you want to{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            create?
          </span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          AI images, 3D models, and creative workflows — in one place.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <PromptBar />
      </motion.div>
    </section>
  );
};

export default HeroSection;
