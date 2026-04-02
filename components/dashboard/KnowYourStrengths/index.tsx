"use client";

import { useState, useEffect } from "react";
import { getStrengthPaymentStatus } from "@/api";
import StrengthLanding from "./StrengthLanding";
import StrengthForm from "./StrengthForm";
import StrengthResults from "./StrengthResults";

type ViewState = "landing" | "form" | "results";

interface KnowYourStrengthsProps {
  onSectionChange: (section: string) => void;
}

export default function KnowYourStrengths({ onSectionChange }: KnowYourStrengthsProps) {
  const [view, setView] = useState<ViewState>("landing");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const res = await getStrengthPaymentStatus();
        if (res.success && res.data?.payment_status === "paid") {
          setView("results");
        }
      } catch (err) {
        console.error("Error checking payment:", err);
      } finally {
        setLoading(false);
      }
    };
    checkPayment();
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

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Know Your Strengths</p>
            <p className="mt-0.5 pb-3 text-xs text-slate-500 dark:text-slate-400">
              Discover your strengths and receive guided recommendations.
            </p>
          </div>
        </header>

        <div className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6" style={{ animation: "fade-in 220ms ease-out" }}>
          {view === "results" && <StrengthResults />}
          {view === "form" && (
            <StrengthForm
              onPaymentSuccess={() => setView("results")}
              onGoToProfile={() => onSectionChange("profile")}
            />
          )}
          {view === "landing" && <StrengthLanding onTakeTest={() => setView("form")} />}
        </div>
      </section>
    </div>
  );
}
