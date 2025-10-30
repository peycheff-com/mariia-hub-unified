import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/components/luxury/**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "src/components/luxury/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.stories.{ts,tsx}",
        "**/index.ts",
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});