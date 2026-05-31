import type { Metadata } from "next";
import CollegeDirectoryDiscovery from "@/components/containers/CollegeDirectoryDiscovery";

export const metadata: Metadata = {
  title: "College Directory | UniTracko",
  description:
    "Browse colleges by degree program — B.A, B.Com, B.Tech, B.Sc, B.Ed — and discover where to apply next.",
};

export default function CollegeDirectoryPage() {
  return <CollegeDirectoryDiscovery />;
}
