"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOTP, initiateGoogleAuth, initiateFacebookAuth } from "@/api";

export function LoginStepOneForm() {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Persist ?ref= referral code so it survives the OTP flow and OAuth redirects
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      sessionStorage.setItem("cf_pending_ref", ref.trim().toUpperCase());
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendOTP(email);
      
      if (response.success) {
        const otpRoute = `/otpverification?email=${encodeURIComponent(email)}`;
        router.prefetch(otpRoute);
        setIsLeaving(true);

        // Eased exit before navigating to OTP page.
        setTimeout(() => {
          router.push(otpRoute);
        }, 260);
      } else {
        setError(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error sending OTP:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleButtonClick() {
    initiateGoogleAuth(sessionStorage.getItem("cf_pending_ref") || undefined);
  }

  function handleFacebookButtonClick() {
    initiateFacebookAuth(sessionStorage.getItem("cf_pending_ref") || undefined);
  }

  return (
    <section
      className={`mx-auto w-full max-w-[460px] transform-gpu transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isLeaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-start shadow-sm sm:p-8"
      >
        <div className="space-y-1.5 text-sm">
          <label
            htmlFor="email"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:border-slate-900"
            placeholder="you@example.com"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white text-[#f0c544] focus:ring-[#f0c544]"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to UniTracko&apos;s{" "}
            <Link
              href="/legal#terms-of-use"
              className="landing-scribble-hover underline underline-offset-2 transition duration-300 hover:text-slate-900"
            >
              Terms of Service
            </Link>
            .
          </span>
        </label>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!email || !agree || isLoading}
          className={`landing-cta mt-1 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${
            isLoading ? "animate-pulse" : ""
          }`}
        >
          {isLoading ? (
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
              <span>Sending OTP...</span>
            </span>
          ) : (
            "Continue to verification"
          )}
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-slate-500">or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleButtonClick}
          disabled={isLoading}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:border-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center justify-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </span>
        </button>

        <button
          type="button"
          onClick={handleFacebookButtonClick}
          disabled={isLoading}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:border-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center justify-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Continue with Facebook</span>
          </span>
        </button>

        <p className="pt-1 text-center text-xs text-slate-500">
          New here? Your account will be created automatically after
          verification.
        </p>
      </form>
    </section>
  );
}
