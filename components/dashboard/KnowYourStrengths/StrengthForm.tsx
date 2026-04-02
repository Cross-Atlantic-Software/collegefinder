"use client";

import { useState, useEffect } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { getStrengthFormData } from "@/api";
import type { StrengthFormData } from "@/api/strength";
import { Button } from "@/components/shared";
import { STRENGTH_PAYMENT_PENDING_KEY } from "./StrengthPaymentReturnHandler";

interface StrengthFormProps {
  onPaymentSuccess: () => void;
  onGoToProfile: () => void;
}

export default function StrengthForm({ onPaymentSuccess, onGoToProfile }: StrengthFormProps) {
  const [formData, setFormData] = useState<StrengthFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStrengthFormData();
        if (res.success && res.data) {
          setFormData(res.data);
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePay = () => {
    setError(null);
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STRENGTH_PAYMENT_PENDING_KEY, String(Date.now()));
    } catch {
      // sessionStorage unavailable (e.g. private mode) — still send user to pay; return flow may need manual confirm
    }
    const payUrl =
      process.env.NEXT_PUBLIC_RAZORPAY_STRENGTH_PAY_URL?.trim() ||
      "https://rzp.io/rzp/uFg2K74V";
    window.location.assign(payUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
      </div>
    );
  }

  const missingFields = !formData?.name || !formData?.email || !formData?.phone;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Your Information
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Confirm your details below before proceeding.
        </p>
      </div>

      {missingFields && (
        <div className="mb-5 rounded-md bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
          <FaExclamationTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Profile incomplete</p>
            <p className="mt-1 text-xs text-amber-700">
              Some required fields are missing. Please complete your profile first.
            </p>
            <button
              onClick={onGoToProfile}
              className="mt-2 text-xs font-semibold text-amber-800 underline transition-colors hover:text-amber-900"
            >
              Go to Profile
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-5 space-y-4">
          <FormField label="Name" value={formData?.name} />
          <FormField label="Class" value={formData?.class_info} />
          <FormField label="School" value={formData?.school} />
          <FormField label="Age" value={formData?.age !== null ? String(formData?.age) : null} />
          <FormField label="Email" value={formData?.email} />
          <FormField label="Phone" value={formData?.phone} />
        </div>
        <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/70">
          <FaInfoCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#b88900]" />
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            This information will be shared with the Strength Masters team so they can prepare your personalised strength analysis and report.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mt-4">{error}</p>
      )}

      <div className="flex flex-col items-center gap-2 mt-5">
        <Button
          variant="themeButton"
          size="sm"
          onClick={handlePay}
          disabled={missingFields}
          className="!text-sm !rounded-full !border-black !bg-black !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pay Now
        </Button>
        <p className="max-w-sm px-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
          You&apos;ll complete payment on Razorpay. After a successful payment you&apos;ll return here to Know Your Strengths and we&apos;ll email you a confirmation.
        </p>
      </div>
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <label className="w-24 flex-shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
        {value || <span className="italic text-slate-500 dark:text-slate-400">Not provided</span>}
      </div>
    </div>
  );
}
