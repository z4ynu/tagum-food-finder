import type { Metadata } from "next";

import { WheelPage } from "@/components/wheel/wheel-page";

export const metadata: Metadata = {
  description: "Add food places and let an equal-chance wheel choose where to eat in Tagum.",
  title: "Spin the wheel | Asa Ta Mangaon?",
};

export default function WheelRoute() {
  return <WheelPage />;
}
