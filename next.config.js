/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    domains: ['ap-backend-taupe.vercel.app', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ap-backend-taupe.vercel.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        // Specific headers for auth routes
        source: '/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    VERCEL: process.env.VERCEL || false,
  },
}

module.exports = nextConfig 