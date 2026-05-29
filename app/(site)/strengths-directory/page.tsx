import type { Metadata } from "next";
import StrengthsDirectoryDiscovery from "@/components/containers/StrengthsDirectoryDiscovery";

export const metadata: Metadata = {
  title: "Know Your Strengths | UniTracko",
  description:
    "Preview psycho-analytical strength profiling — Gallup-backed assessment and career recommendations.",
};

export default function StrengthsDirectoryPage() {
  return <StrengthsDirectoryDiscovery />;
}
