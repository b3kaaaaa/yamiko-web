import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'vusxyaqytmfebmctlqhz.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cover.imglib.info',
      },
      {
        protocol: 'https',
        hostname: 'remanga.org',
      },
    ],
  },
};

export default nextConfig;
