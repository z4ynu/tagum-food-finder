import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#F7FAF7",
    description: "Find food places in Tagum based on what matters to you.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "192x192",
        src: "/brand/icon-192.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/brand/icon-512.png",
        type: "image/png",
      },
    ],
    lang: "en",
    name: "Asa Ta Mangaon?",
    orientation: "any",
    scope: "/",
    short_name: "Asa Ta Mangaon?",
    start_url: "/",
    theme_color: "#2E7D32",
  };
}
