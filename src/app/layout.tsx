import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ServiceWorkerRegistration } from "@/platform/pwa/service-worker-registration";

import "./globals.css";

export const metadata: Metadata = {
  title: "Asa Ta Mangaon? | Tagum Food Finder",
  description: "Find nearby food places in Tagum based on what fits your moment.",
  icons: {
    apple: "/brand/apple-touch-icon.png",
    icon: [
      { type: "image/svg+xml", url: "/brand/mascot-mark.svg" },
      { sizes: "32x32", type: "image/png", url: "/brand/favicon-32.png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    follow: false,
    googleBot: {
      follow: false,
      index: false,
      noimageindex: true,
    },
    index: false,
    nocache: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#F7FAF7",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
