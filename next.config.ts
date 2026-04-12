import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.storage.yandexcloud.net',
      },
      {
        protocol: 'https',
        hostname: 'storage.yandexcloud.net',
      },
    ],
  },
  experimental: {
    ppr: 'incremental',
  },
}

export default nextConfig