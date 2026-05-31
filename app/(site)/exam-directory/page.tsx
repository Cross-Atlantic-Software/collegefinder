import type { Metadata } from "next";
import ExamDirectoryDiscovery from "@/components/containers/ExamDirectoryDiscovery";

export const metadata: Metadata = {
  title: "Exam Directory | UniTracko",
  description:
    "Browse entrance exams by academic stream. Discover national and state-level exams mapped to PCM, PCB, Commerce, and more.",
};

export default function ExamDirectoryPage() {
  return <ExamDirectoryDiscovery />;
}
