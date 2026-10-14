import type { Metadata } from "next";

import { SavedPage } from "@/components/saved/saved-page";

export const metadata: Metadata = {
  description: "Review saved food places and reusable wheel lists for Tagum City.",
  title: "Saved | Asa Ta Mangaon?",
};

export default function SavedRoute() {
  return <SavedPage />;
}
