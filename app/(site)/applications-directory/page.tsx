import type { Metadata } from "next";
import ApplicationsDirectoryDiscovery from "@/components/containers/ApplicationsDirectoryDiscovery";

export const metadata: Metadata = {
  title: "Applications Directory | UniTracko",
  description:
    "Preview exam application automation — All, Ready, In Progress, and Completed — before you log in.",
};

export default function ApplicationsDirectoryPage() {
  return <ApplicationsDirectoryDiscovery />;
}
