import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd =mode === "production" || process.env.VITE_APP_ENV === "production";
  return {
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
  isProd
      ? {
          minify: "esbuild",
          esbuild: {
            // Treat these calls as pure so esbuild drops them
            pure: ["console.log"],
          },
        }
      : {},
  };
});
