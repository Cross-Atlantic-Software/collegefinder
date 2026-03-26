"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyOTP, resendOTP } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

const OTP_LENGTH = 6;

type OtpVerificationFormProps = {
  emailHint?: string;
  onVerified?: (code: string) => void;
};

export function OtpVerificationForm({
  emailHint,
  onVerified,
}: OtpVerificationFormProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Correct ref type
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!text) return;

    const next = text
      .split("")
      .concat(Array(OTP_LENGTH).fill(""))
      .slice(0, OTP_LENGTH);

    setOtp(next);

    const lastIndex = Math.min(text.length, OTP_LENGTH) - 1;
    if (lastIndex >= 0) {
      inputsRef.current[lastIndex]?.focus();
    }

    event.preventDefault();
  };

  const code = otp.join("");
  const isComplete = code.length === OTP_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !emailHint) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await verifyOTP(emailHint, code);
      
      if (response.success && response.data) {
        setSuccess(true);
        // Store token and user data
        // Convert null to undefined for name property to match User type
        const user = {
          ...response.data.user,
          name: response.data.user.name ?? undefined
        };
        login(response.data.token, user);
        onVerified?.(code);
        
        // Redirect based on whether user has completed onboarding
        // If onboarding_completed is true → go to dashboard
        // If onboarding_completed is false/null → go to onboarding step-1
        const onboardingCompletedValue = response.data.user?.onboarding_completed;
        
        // More robust check - handle boolean, string, number, or truthy values
        let onboardingCompleted = false;
        if (onboardingCompletedValue !== null && onboardingCompletedValue !== undefined) {
          if (onboardingCompletedValue === true) {
            onboardingCompleted = true;
          } else if (onboardingCompletedValue === false) {
            onboardingCompleted = false;
          } else {
            // TypeScript doesn't know the exact type, so we check at runtime
            const valueType = typeof onboardingCompletedValue;
            if (valueType === 'string') {
              const strValue = onboardingCompletedValue as unknown as string;
              onboardingCompleted = strValue.toLowerCase() === 'true' || strValue === 't';
            } else if (valueType === 'number') {
              const numValue = onboardingCompletedValue as unknown as number;
              onboardingCompleted = numValue === 1;
            } else {
              // Fallback: treat as truthy
              onboardingCompleted = !!onboardingCompletedValue;
            }
          }
        }
        
        // Debug logging
        console.log('🔍 OTP Verification - Full response:', JSON.stringify(response, null, 2));
        console.log('🔍 OTP Verification - User data:', response.data.user);
        console.log('🔍 OTP Verification - onboarding_completed (raw):', onboardingCompletedValue, 'Type:', typeof onboardingCompletedValue);
        console.log('🔍 OTP Verification - onboarding_completed (converted):', onboardingCompleted);
        console.log('🔍 OTP Verification - Will redirect to:', onboardingCompleted ? '/dashboard' : '/step-1');
        
        // Prefetch target route for faster loading
        if (onboardingCompleted) {
          router.prefetch("/dashboard");
        } else {
          router.prefetch("/step-1");
        }
        // Small delay for smooth transition, then redirect
        setTimeout(() => {
          if (onboardingCompleted) {
            router.replace("/dashboard");
          } else {
            router.replace("/step-1");
          }
        }, 300);
      } else {
        setError(response.message || "Invalid OTP code. Please try again.");
        // Clear OTP on error
        setOtp(Array(OTP_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error verifying OTP:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailHint || resending) return;

    setResending(true);
    setError(null);

    try {
      const response = await resendOTP(emailHint);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error resending OTP:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <section
      className={`mx-auto w-full max-w-[460px] transform-gpu transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-start shadow-sm sm:p-8"
      >
        <p className="text-sm leading-relaxed text-slate-600">
        We&apos;ve sent a 6-digit code to{" "}
        <span className="font-semibold text-slate-900">
          {emailHint ?? "your email"}
        </span>
        . Enter it below to continue.
        </p>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {resending ? "OTP resent successfully!" : "Verification successful! Redirecting..."}
          </div>
        )}
        <div className="flex justify-between gap-2 sm:gap-3">
          {otp.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                // 👇 no return, just assign
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-4 text-center text-xl font-semibold text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:border-slate-900"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={!isComplete || submitting}
          className={`landing-cta mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${
            submitting ? "animate-pulse" : ""
          }`}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Verifying...</span>
            </span>
          ) : (
            "Verify and continue"
          )}
        </button>

        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="text-left underline underline-offset-2 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleResend}
            disabled={resending || !emailHint}
          >
            {resending ? "Resending..." : "Didn't get the code? Resend"}
          </button>
          <p className="text-slate-500">Using a different email? Go back and update it.</p>
        </div>
      </form>
    </section>
  );
}
