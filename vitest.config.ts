import { defineConfig } from "vitest/config";

// Mirror the "@/*" -> "./*" path alias from tsconfig.json so imports resolve under Vitest.
// Vitest runs from the project root, so process.cwd() is the alias target.
export default defineConfig({
  resolve: {
    alias: {
      "@": process.cwd(),
    },
  },
  // Transform JSX/TSX with React's automatic runtime so component tests work.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    // Pure-logic *.test.ts stay in fast node; component *.test.tsx get a DOM.
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "src/**"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/types/**"],
    },
  },
});
