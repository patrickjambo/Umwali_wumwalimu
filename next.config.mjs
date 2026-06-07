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
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"]
    }
  }
};

export default withPWA(nextConfig);
