import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper hydration and production stability
  reactStrictMode: true,
  // Optimize for production
  swcMinify: true,
  // Handle potential CSS issues
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Output configuration for better debugging
  output: 'standalone',
  // Ensure proper asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
};

export default nextConfig;
