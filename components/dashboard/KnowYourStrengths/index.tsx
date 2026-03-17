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
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500/30 border-t-pink" />
      </div>
    );
  }

  if (view === "results") {
    return <StrengthResults />;
  }

  if (view === "form") {
    return (
      <StrengthForm
        onPaymentSuccess={() => setView("results")}
        onGoToProfile={() => onSectionChange("profile")}
      />
    );
  }

  return <StrengthLanding onTakeTest={() => setView("form")} />;
}
