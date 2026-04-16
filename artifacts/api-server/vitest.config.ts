import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/commissionEngine.ts",
        "src/lib/circuitBreaker.ts",
        "src/lib/cache.ts",
        "src/lib/jwt.ts",
        "src/lib/tokenBlacklist.ts",
        "src/lib/loginGuard.ts",
        "src/middlewares/idempotencyGuard.ts",
        "src/middlewares/sanitize.ts",
        "src/routes/webhooks.ts",
      ],
      reporter: ["text", "text-summary"],
    },
    testTimeout: 15000,
    hookTimeout: 10000,
  },
});
