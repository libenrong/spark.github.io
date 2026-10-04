import type { NextConfig } from 'next';
import { env } from './src/env';

// Static export mode (GitHub Pages): set NEXT_PUBLIC_STATIC_EXPORT=1 at build.
const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
    output: staticExport ? 'export' : 'standalone',
    basePath,
    images: staticExport ? { unoptimized: true } : {},
    webpack: config => {
        config.module.rules.push({
            test: /\.svg$/,
            use: [{ loader: '@svgr/webpack', options: { dimensions: false } }],
        });
        return config;
    },
    // Rewrites are server-only and ignored by `output: 'export'`.
    ...(staticExport
        ? {}
        : {
              rewrites: async () => [
                  {
                      source: '/docs/:path*',
                      destination: env.SPARK_DOCS_URL + '/:path*',
                  },
                  {
                      source: '/thumb/:slug',
                      destination: env.SPARK_THUMBNAIL_SERVICE_URL + '/:slug',
                  },
                  {
                      source: '/:slug',
                      has: [{ type: 'query', key: 'raw' }],
                      destination: env.SPARK_JSON_SERVICE_URL + '/:slug',
                  },
              ],
          }),
};

export default nextConfig;
