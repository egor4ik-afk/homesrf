import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '9000-firebase-homesrf-1775994164817.cluster-oayqgyglpfgseqclbygurw4xd4.cloudworkstations.dev',
  ],
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.relaxdev.ru',
      },
    ],
  },
}

export default nextConfig