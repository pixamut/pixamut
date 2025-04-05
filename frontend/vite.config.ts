/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig, esbuildVersion } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: ["esnext"],
  },
  esbuild: {
    target: "esnext",
  },
  plugins: [
    react(),
    legacy({
      renderLegacyChunks: false,
    }),
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
} as any);