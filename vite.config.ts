import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { offlineBuild } from "./scripts/offline-build";
export default defineConfig({
  base: "./",
  plugins: [react(), offlineBuild()],
  test: {
    environment: "node",
    exclude: ["tests/e2e/**", "tests/offline/**", "node_modules/**", "dist/**"],
  },
});
