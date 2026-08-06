import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Static export keeps Nest `api/index.js` on the same Vercel project.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
  turbopack: {
    resolveAlias: {
      '@': path.join(__dirname),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
    };
    return config;
  },
};

export default nextConfig;
