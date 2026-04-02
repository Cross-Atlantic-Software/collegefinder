"use client";

import { useState, useEffect, useRef } from "react";
import { FaLock, FaChevronLeft, FaChevronRight, FaArrowRight } from "react-icons/fa";
import { getAllExperts, getStrengthPaymentStatus } from "@/api";
import type { ExpertsGrouped } from "@/api/experts";
import ExpertCard from "./ExpertCard";
import { Button } from "@/components/shared";

const TYPE_LABELS: Record<string, string> = {
  career_consultant: "Career Consultants",
  essay_resume: "Essay & Resume",
  travel_visa: "Travel & Visa",
  accommodation: "Accommodation",
  loans_finance: "Loans & Finance",
};

const TYPE_ORDER = ["career_consultant", "essay_resume", "travel_visa", "accommodation", "loans_finance"];

interface AdmissionHelpProps {
  onSectionChange?: (section: string) => void;
}

export default function AdmissionHelp({ onSectionChange }: AdmissionHelpProps) {
  const [experts, setExperts] = useState<ExpertsGrouped>({});
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expertsRes, paymentRes] = await Promise.all([
          getAllExperts(),
          getStrengthPaymentStatus(),
        ]);
        if (expertsRes.success && expertsRes.data) {
          setExperts(expertsRes.data.experts);
        }
        if (paymentRes.success && paymentRes.data) {
          setIsPaid(paymentRes.data.payment_status === "paid");
        }
      } catch (err) {
        console.error("Error fetching admission help data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#f5f9ff] p-4 dark:bg-slate-950 md:p-6">
        <div className="flex items-center justify-center rounded-xl bg-white py-16 shadow-sm dark:bg-slate-900">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
        </div>
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="w-full min-h-screen bg-[#f5f9ff] p-4 dark:bg-slate-950 md:p-6">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                <FaLock className="h-6 w-6 text-[#b88900]" />
              </span>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Unlock expert guidance</h3>
            <p className="mx-auto mb-5 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Complete your Strength Analysis to unlock Admission Help and connect with career consultants, essay experts, and more.
            </p>
            {onSectionChange && (
              <Button
                variant="themeButton"
                size="sm"
                onClick={() => onSectionChange("know-your-strengths")}
                className="inline-flex items-center gap-2 !rounded-full !border-black !bg-black !text-[#FAD53C] !text-sm transition-all duration-200 hover:!bg-black/90"
              >
                Go to Know Your Strengths
                <FaArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const visibleTypes = TYPE_ORDER.filter((type) => experts[type] && experts[type].length > 0);

  if (visibleTypes.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#f5f9ff] p-4 dark:bg-slate-950 md:p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Admission Help</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">No experts available at the moment. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admission Help</p>
            <p className="mt-0.5 pb-3 text-xs text-slate-500 dark:text-slate-400">Connect with verified experts for each admission step.</p>
          </div>
        </header>

        <div className="space-y-6 bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6" style={{ animation: "fade-in 220ms ease-out" }}>
          {visibleTypes.map((type) => (
            <ExpertCarousel key={type} type={type} label={TYPE_LABELS[type]} experts={experts[type]} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ExpertCarousel({ type, label, experts }: { type: string; label: string; experts: ExpertsGrouped[string] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </div>
  );
}
