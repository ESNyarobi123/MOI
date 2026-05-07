import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const loaded = loadEnv("test", process.cwd(), "");

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      ...loaded,
      // Must not contain "replace_me" (see src/lib/auth/jwt.ts)
      JWT_SECRET: "vitest-unit-jwt-secret-minimum-32-characters-long-xx",
      JWT_REFRESH_SECRET:
        "vitest-unit-refresh-secret-minimum-32-characters-long-x"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
