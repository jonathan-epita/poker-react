import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

/**
 * ONE config for build and test. `VITE_BASE_PATH` is the single deployment
 * knob: set it to the public sub-path the site is served from (GitHub Pages:
 * "/poker-react/"). Unset means served from the domain root.
 */
const { version } = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    restoreMocks: true,
    setupFiles: ["vitest.setup.ts"],
  },
});
