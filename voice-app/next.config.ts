import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
