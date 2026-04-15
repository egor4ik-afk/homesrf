import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Вот это спасет от ошибки "Blocked cross-origin request"
  allowedDevOrigins: [
    "9000-firebase-homesrf-1775994164817.cluster-oayqgyglpfgseqclbygurw4xd4.cloudworkstations.dev"
  ],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "image.thum.io" },
      { protocol: "https", hostname: "avatars.yandex.net" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "storage.yandexcloud.net" },
      // ✅ Добавляем Unsplash для красивых заглушек
      { protocol: "https", hostname: "images.unsplash.com" } 
    ],
  },
};

export default nextConfig;