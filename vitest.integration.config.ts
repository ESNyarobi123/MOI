import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const loaded = loadEnv("test", process.cwd(), "");

/** Live DB smoke tests — requires `npm run prisma:migrate:neon` (or deploy) so schema matches Prisma. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: {
      ...loaded,
      JWT_SECRET: "vitest-integration-jwt-secret-minimum-32-characters-long",
      JWT_REFRESH_SECRET:
        "vitest-integration-refresh-secret-minimum-32-characters-x"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
