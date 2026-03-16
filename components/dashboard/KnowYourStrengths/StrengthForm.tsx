"use client";

import { useState, useEffect } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { getStrengthFormData, makeStrengthPayment } from "@/api";
import type { StrengthFormData } from "@/api/strength";
import { Button } from "@/components/shared";

interface StrengthFormProps {
  onPaymentSuccess: () => void;
  onGoToProfile: () => void;
}

export default function StrengthForm({ onPaymentSuccess, onGoToProfile }: StrengthFormProps) {
  const [formData, setFormData] = useState<StrengthFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
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

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const res = await makeStrengthPayment();
      if (res.success) {
        onPaymentSuccess();
      } else {
        setError(res.message || "Payment failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500/30 border-t-pink" />
      </div>
    );
  }

  const missingFields = !formData?.name || !formData?.email || !formData?.phone;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-sm font-bold text-slate-100">
          Your Information
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Confirm your details below before proceeding.
        </p>
      </div>

      {missingFields && (
        <div className="mb-5 rounded-md bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
          <FaExclamationTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-200 text-sm font-medium">Profile incomplete</p>
            <p className="text-slate-400 text-xs mt-1">
              Some required fields are missing. Please complete your profile first.
            </p>
            <button
              onClick={onGoToProfile}
              className="mt-2 text-xs font-semibold text-pink underline hover:text-pink/80 transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </div>
      )}

      <div className="rounded-md bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-5 space-y-4">
          <FormField label="Name" value={formData?.name} />
          <FormField label="Class" value={formData?.class_info} />
          <FormField label="School" value={formData?.school} />
          <FormField label="Age" value={formData?.age !== null ? String(formData?.age) : null} />
          <FormField label="Email" value={formData?.email} />
          <FormField label="Phone" value={formData?.phone} />
        </div>
        <div className="px-5 py-3 border-t border-white/10 bg-white/5 flex items-start gap-2">
          <FaInfoCircle className="w-3.5 h-3.5 text-pink/80 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            This information will be shared with the Strength Masters team so they can prepare your personalised strength analysis and report.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mt-4">{error}</p>
      )}

      <div className="flex justify-center mt-5">
        <Button
          variant="themeButton"
          size="sm"
          onClick={handlePay}
          disabled={paying || missingFields}
          className="!text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pink disabled:hover:text-white"
        >
          {paying ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing...
            </span>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <label className="text-xs font-medium text-slate-400 w-24 flex-shrink-0">
        {label}
      </label>
      <div className="flex-1 min-w-0 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100">
        {value || <span className="text-slate-500 italic">Not provided</span>}
      </div>
    </div>
  );
}
