/** @type {import('next').NextConfig} */
const config = {
  // the Docker image sets STANDALONE=1; `next start` (e2e) does not work with standalone output
  output: process.env.STANDALONE ? 'standalone' : undefined,
  reactStrictMode: true,
  // the persona prompt is read from disk at runtime
  outputFileTracingIncludes: { '/api/ai': ['./src/ai/persona*.md'] },
};

export default config;
