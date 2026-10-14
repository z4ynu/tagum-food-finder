import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ServiceWorkerRegistration } from "@/platform/pwa/service-worker-registration";

import "./globals.css";

export const metadata: Metadata = {
  title: "Asa Ta Mangaon? | Tagum Food Finder",
  description: "Find nearby food places in Tagum based on what fits your moment.",
  manifest: "/manifest.webmanifest",
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
