import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper hydration and production stability
  reactStrictMode: true,
  // Optimize for production
  swcMinify: true,
  // Handle potential hydration issues
  experimental: {
    // Disable problematic features that can cause hydration issues
    optimizeCss: false,
    // Ensure proper client/server boundary
    esmExternals: 'loose',
  },
  // Output configuration for better debugging
  output: 'standalone',
  // Ensure proper asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  // Add compiler options to handle hydration
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Prevent hydration issues
  poweredByHeader: false,
};

export default nextConfig;
