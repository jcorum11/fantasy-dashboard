import { defineConfig } from "vitest/config";

// Mirror the "@/*" -> "./*" path alias from tsconfig.json so imports resolve under Vitest.
// Vitest runs from the project root, so process.cwd() is the alias target.
export default defineConfig({
  resolve: {
    alias: {
      "@": process.cwd(),
    },
  },
  test: {
    environment: "node",
    globals: true,
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
