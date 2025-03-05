import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['monei.ts'],
      exclude: ['src/**', 'scripts/**', 'axios.ts']
    }
  }
});
