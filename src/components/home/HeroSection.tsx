import { motion } from "framer-motion";
import PromptBar from "./PromptBar";

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-10"
      >
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
          // RAPID ASSETS STUDIO
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Generate Assets
          <br />
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Rapidly.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Describe it. Generate it. Ship it. From concept to game-ready asset in seconds.
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
