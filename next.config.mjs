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
};

export default withPWA(nextConfig);
