import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Serverless for Vercel - no static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
