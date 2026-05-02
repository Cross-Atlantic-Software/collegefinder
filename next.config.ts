import type { NextConfig } from "next";

/** Docker on Windows: Node fetch to `localhost` can target IPv6 while the port is IPv4-only. */
function backendOriginForRewrites(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";
  try {
    const u = new URL(raw);
    if (u.hostname === "localhost" || u.hostname === "[::1]" || u.hostname === "::1") {
      u.hostname = "127.0.0.1";
    }
    const base = `${u.origin}${u.pathname.replace(/\/$/, "")}`;
    const origin = base.replace(/\/api\/?$/i, "");
    return origin || "http://127.0.0.1:5001";
  } catch {
    return (
      raw.replace(/\/api\/?$/i, "") || "http://127.0.0.1:5001"
    );
  }
}

const nextConfig: NextConfig = {
  experimental: {
    // Avoid a separate webpack child process; on ~2GB RAM that pairing often gets OOM-killed (SIGKILL).
    webpackBuildWorker: false,
    // Lowers peak memory during `next build` on small VPS instances.
    serverMinification: false,
  },
  // Proxy /api to backend so browser requests to same-origin /api/* reach the Express server
  async rewrites() {
    const backendOrigin = backendOriginForRewrites();
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
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
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
  // Serializes webpack module graph work — slower builds, much lower peak RSS on 2GB hosts.
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
};

export default nextConfig;
