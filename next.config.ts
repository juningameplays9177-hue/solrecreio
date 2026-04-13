import type { NextConfig } from "next";

/** Garante NEXT_PUBLIC_* no bundle mesmo sem .env no CI / Firebase build. */
const FB = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyDaiAatah5a6sOcxaWDwsiZXqzXtNe2QXA",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "soldorecreio-8534a.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "soldorecreio-8534a",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "soldorecreio-8534a.firebasestorage.app",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "338638310998",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:338638310998:web:a77e3c0f2fde633fa275f7",
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-X1LJFY9L17",
} as const;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FB.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FB.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FB.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FB.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      FB.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FB.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || FB.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  async redirects() {
    return [
      { source: "/entrar", destination: "/login", permanent: false },
      { source: "/cadastro", destination: "/register", permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  /** Chunks com hash: cache longo. HTML sem cache fica no middleware. */
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
