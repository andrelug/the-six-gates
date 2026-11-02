import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const regras = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ['.next/**', 'node_modules/**', 'content/story.json', 'next-env.d.ts', 'playwright-report/**', 'test-results/**'] },
];

export default regras;
