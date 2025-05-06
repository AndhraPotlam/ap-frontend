/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'image.com',
      'images.unsplash.com',
      'placehold.co',
      'andhra-potlam.s3.ap-south-1.amazonaws.com'
    ],
  },
}

module.exports = nextConfig 