/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    NEXT_PUBLIC_API_USERNAME: process.env.NEXT_PUBLIC_API_USERNAME || 'admin',
    NEXT_PUBLIC_API_PASSWORD: process.env.NEXT_PUBLIC_API_PASSWORD || 'secret',
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig