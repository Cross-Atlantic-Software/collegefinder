import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Avoid a separate webpack child process; on ~2GB RAM that pairing often gets OOM-killed (SIGKILL).
    webpackBuildWorker: false,
    // Lowers peak memory during `next build` on small VPS instances.
    serverMinification: false,
  },
  // Proxy /api to backend so browser requests to same-origin /api/* reach the Express server
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const backendOrigin = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5001';
    return [{ source: '/api/:path*', destination: `${backendOrigin}/api/:path*` }];
  },
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        pathname: '/**',
      },
    ],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Explicitly opt into Turbopack (default in Next.js 16) — silences the webpack/turbopack mismatch warning
  turbopack: {},
};

export default nextConfig;
