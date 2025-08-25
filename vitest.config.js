import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: [
        "src/handlers/**/*.js",
        "src/infrastructure/config/Container.js",
        "**/*.test.js",
        "**/*.spec.js",
        "node_modules/**",
        "coverage/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
