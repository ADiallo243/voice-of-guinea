import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voice of Guinea",
    short_name: "Voice of Guinea",
    description:
      "Actualités, politique, économie, culture, sport et divertissement en Guinée.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#137547",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
