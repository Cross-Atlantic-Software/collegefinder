import type { Metadata } from "next";
import AdmissionHelpDirectoryDiscovery from "@/components/containers/AdmissionHelpDirectoryDiscovery";

export const metadata: Metadata = {
  title: "Admission Help | UniTracko",
  description:
    "Preview expert admission guidance — career consultants, essay support, visa help, and more.",
};

export default function AdmissionHelpDirectoryPage() {
  return <AdmissionHelpDirectoryDiscovery />;
}
