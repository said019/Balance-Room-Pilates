import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function stampServiceWorkerVersion(): Plugin {
  const buildVersion = `br-${Date.now().toString(36)}`;

  return {
    name: "stamp-service-worker-version",
    apply: "build",
    closeBundle() {
      const serviceWorkerPath = path.resolve(__dirname, "dist/sw.js");
      const source = readFileSync(serviceWorkerPath, "utf8");

      if (!source.includes("__BUILD_VERSION__")) {
        throw new Error("Service worker build-version placeholder is missing");
      }

      writeFileSync(
        serviceWorkerPath,
        source.replaceAll("__BUILD_VERSION__", buildVersion),
        "utf8",
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    stampServiceWorkerVersion(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
