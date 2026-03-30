import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    outDir: "dist",
  },
  staged: {
    "*.ts": "vp check --fix",
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["index.ts", "src/*.ts"],
    },
    include: ["tests/**/*.test.ts"],
  },
});
