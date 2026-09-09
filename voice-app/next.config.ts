import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://www.googletagmanager.com https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  experimental: {
    // Images are validated to 10 MB on the server. Leave multipart overhead.
    serverActions: { bodySizeLimit: "11mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wxkjufmwydzaiwczuthc.supabase.co",
        pathname: "/storage/v1/object/public/article-images/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/news.html", destination: "/actualites", permanent: true },
      { source: "/culture.html", destination: "/culture", permanent: true },
      { source: "/entertainment.html", destination: "/divertissement", permanent: true },
      { source: "/about.html", destination: "/a-propos", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      {
        source: "/articles/:slug.html",
        destination: "/articles/:slug",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
