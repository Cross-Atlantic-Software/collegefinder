"use client";

import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getAllExperts, type ExpertsGrouped } from "@/api/experts";
import ExpertCard from "@/components/dashboard/AdmissionHelp/ExpertCard";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

const TYPE_LABELS: Record<string, string> = {
  career_consultant: "Career Consultants",
  essay_resume: "Essay & Resume",
  travel_visa: "Travel & Visa",
  accommodation: "Accommodation",
  loans_finance: "Loans & Finance",
};

const TYPE_ORDER = [
  "career_consultant",
  "essay_resume",
  "travel_visa",
  "accommodation",
  "loans_finance",
];

function ExpertCarousel({
  label,
  experts,
}: {
  label: string;
  experts: ExpertsGrouped[string];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{label}</h3>
        <div className="flex gap-1">
          <span className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500">
            <FaChevronLeft className="h-3 w-3" />
          </span>
          <span className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500">
            <FaChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </div>
  );
}

export default function AdmissionHelpDirectoryContent() {
  const [experts, setExperts] = useState<ExpertsGrouped>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllExperts();
        if (cancelled) return;
        if (res.success && res.data) {
          setExperts(res.data.experts);
        } else {
          setError(res.message || "Could not load experts.");
        }
      } catch {
        if (!cancelled) setError("Could not load experts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <OnboardingLoader message="Loading admission help…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    );
  }

  const visibleTypes = TYPE_ORDER.filter((type) => experts[type]?.length);

  if (!visibleTypes.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">No experts available at the moment. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleTypes.map((type) => (
        <ExpertCarousel key={type} label={TYPE_LABELS[type]} experts={experts[type]} />
      ))}
    </div>
  );
}
