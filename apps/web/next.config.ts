import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nexa/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "radix-ui"],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
