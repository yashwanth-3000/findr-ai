import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  // Disable type checking during build for now
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build for now
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
