import type { Metadata } from "next";
import CommandCenterOverviewDiscovery from "@/components/containers/CommandCenterOverviewDiscovery";

export const metadata: Metadata = {
  title: "Command Center Overview | UniTracko",
  description:
    "Preview your admission command center. Log in to track exams, colleges, deadlines, and applications in one place.",
};

export default function CommandCenterOverviewPage() {
  return <CommandCenterOverviewDiscovery />;
}
