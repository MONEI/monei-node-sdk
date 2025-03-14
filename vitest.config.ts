import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      include: ['index.ts', 'src/*.ts']
    },
    include: ['tests/**/*.test.ts']
  }
});
