import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force webpack instead of Turbopack (Turbopack doesn't work with WASM bindings)
  webpack: (config, { isServer }) => {
    return config;
  },
};

export default nextConfig;
