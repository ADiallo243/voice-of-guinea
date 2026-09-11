import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/auth/"],
    },
    sitemap: [
      "https://www.voiceofguinea.com/sitemap.xml",
      "https://www.voiceofguinea.com/news-sitemap.xml",
    ],
    host: "https://www.voiceofguinea.com",
  };
}
