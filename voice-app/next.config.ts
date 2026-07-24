import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
