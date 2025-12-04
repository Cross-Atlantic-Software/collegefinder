import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force webpack instead of Turbopack (Turbopack doesn't work with WASM bindings)
  webpack: (config, { isServer }) => {
    return config;
  },
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
    ],
  },
};

export default nextConfig;
