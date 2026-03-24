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
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500/30 border-t-pink" />
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-slate-100">Admission Help</h2>
        <div className="rounded-md bg-white/5 border border-white/10 overflow-hidden max-w-md mx-auto">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border border-white/10">
                <FaLock className="w-6 h-6 text-pink" />
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Unlock expert guidance</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-5">
              Complete your Strength Analysis to unlock Admission Help and connect with career consultants, essay experts, and more.
            </p>
            {onSectionChange && (
              <Button
                variant="themeButton"
                size="sm"
                onClick={() => onSectionChange("know-your-strengths")}
                className="!text-sm inline-flex items-center gap-2"
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
      <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Admission Help</h2>
        <p className="text-slate-400 text-sm">No experts available at the moment. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Admission Help</h2>
      {visibleTypes.map((type) => (
        <ExpertCarousel key={type} type={type} label={TYPE_LABELS[type]} experts={experts[type]} />
      ))}
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
    <div className="rounded-xl bg-white/5 border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-white">{label}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
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
