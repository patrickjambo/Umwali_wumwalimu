import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    { 
      urlPattern: /\/api\/questions/, 
      handler: "StaleWhileRevalidate" 
    },
    { 
      urlPattern: /\/signs\/.*\.svg/, 
      handler: "CacheFirst",
      options: { cacheName: "signs", expiration: { maxAgeSeconds: 86400 * 30 } } 
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't let lint warnings fail the production build / deploy.
  eslint: { ignoreDuringBuilds: true },
  // Remove the dev-tools indicator badge (dev-only; never shows in production).
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  // Long-cache the background photos so repeat navigations are instant.
  async headers() {
    return [
      {
        source: "/photo/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default withPWA(nextConfig);
