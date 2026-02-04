import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  console.log(mode,'here is mode======================>>'),
  server: {
    host: "::",
    port: 7071,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // In production builds, remove console.log/info/debug/warn but keep console.error
  build:
    mode === "production"
      ? {
          minify: "esbuild",
          esbuild: {
            // Treat these calls as pure so esbuild drops them
            pure: ["console.log"],
          },
        }
      : {},
}));
