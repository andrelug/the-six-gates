import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': r('./src'), '@content': r('./content') } },
  test: { testTimeout: 30_000, include: ['tests/unit/**/*.test.ts', 'tests/live/**/*.test.ts'], globalSetup: ['tests/setup.ts'] },
});
