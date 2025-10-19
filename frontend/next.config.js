/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   appDir: true,
  // },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://digitallz-api.railway.app' 
      : 'http://localhost:3001',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    return config
  },
}

module.exports = nextConfig
