import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import CreationWidget from "./CreationWidget";

const capabilityPills = [
  "✦ Image Generation",
  "✦ Image Editing",
  "✦ Text → 3D",
  "✦ Image → 3D",
  "✦ AI Assist",
];

const stats = [
  { value: "6M+", label: "Creators worldwide" },
  { value: "50+", label: "AI models available" },
  { value: "< 30s", label: "Average generation time" },
];

interface HeroSectionProps {
  promptValue: string;
  onPromptChange: (val: string) => void;
  pulsePrompt: boolean;
}

const HeroSection = ({ promptValue, onPromptChange, pulsePrompt }: HeroSectionProps) => {
  return (
    <section
      className="relative overflow-hidden"
      style={{ padding: "80px 40px 64px" }}
    >
      {/* Transparent — background image shows through from SidebarLayout */}

      <div className="relative z-10 max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* LEFT COLUMN */}
        <div className="flex-1 lg:max-w-[55%] lg:pr-12 rounded-2xl p-6 lg:p-8" style={{ background: "rgba(13,13,16,0.65)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(61,61,77,0.4)" }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <span
              className="inline-block text-[11px] font-medium px-3.5 py-1.5 rounded-full"
              style={{
                background: "rgba(124,90,246,0.15)",
                border: "1px solid rgba(124,90,246,0.4)",
                color: "#A78BFA",
                letterSpacing: "0.06em",
              }}
            >
              ✦ AI Creative Studio for Game Developers
            </span>
          </motion.div>

          <motion.h1
            className="mt-5"
            style={{ lineHeight: 1.15 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="block text-4xl lg:text-[52px] font-bold text-foreground">Generate.</span>
            <motion.span
              className="block text-4xl lg:text-[52px] font-bold text-foreground"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
            >
              Edit.
            </motion.span>
            <motion.span
              className="block text-4xl lg:text-[52px] font-bold"
              style={{ color: "#7C5AF6" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.5 }}
            >
              Build in 3D.
            </motion.span>
          </motion.h1>

          <motion.p
            className="mt-5 text-base leading-relaxed max-w-md"
            style={{ color: "#9CA3AF", lineHeight: 1.65 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            From text prompt to game-ready 3D asset in minutes. Generate images, edit them intelligently, and convert to GLB — all from one unified AI pipeline.
          </motion.p>

          <motion.div
            className="mt-6 flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            {capabilityPills.map((pill, i) => (
              <motion.span
                key={pill}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150 cursor-default"
                style={{
                  background: "#2A2A35",
                  border: "1px solid #3D3D4D",
                  color: "#9CA3AF",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.03, duration: 0.4 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#A78BFA";
                  e.currentTarget.style.color = "#E5E7EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#3D3D4D";
                  e.currentTarget.style.color = "#9CA3AF";
                }}
              >
                {pill}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            className="mt-8 hidden md:flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-8" style={{ background: "#3D3D4D" }} />}
                <div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COLUMN — CREATION WIDGET */}
        <motion.div
          className="w-full lg:w-[45%] lg:max-w-lg"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <CreationWidget
            promptValue={promptValue}
            onPromptChange={onPromptChange}
            pulsePrompt={pulsePrompt}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
