/** @type {import('next').NextConfig} */
const isGHPages = process.env.DEPLOY_TARGET === 'ghpages'

const nextConfig = {
  ...(isGHPages
    ? {
        output: 'export',
        basePath: '/navniai',
        assetPrefix: '/navniai/',
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: process.env.DEPLOY_TARGET || 'vercel',
  },
}

module.exports = nextConfig
