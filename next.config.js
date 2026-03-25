/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/navniai',
  assetPrefix: '/navniai/',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  trailingSlash: true,
}

module.exports = nextConfig
