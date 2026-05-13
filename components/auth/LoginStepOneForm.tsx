"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  checkEmailRegistrationStatus,
  initiateFacebookAuth,
  initiateGoogleAuth,
  loginWithPassword,
  sendOTP,
  startSignup,
  verifyOTP,
} from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordStrengthIndicator } from "@/components/admin/PasswordStrengthIndicator";
import { isPasswordStrong } from "@/lib/passwordStrength";

type LoginStepOneFormProps = {
  mode?: "login" | "signup";
};

const OTP_LENGTH = 6;

const authFormMemory: Record<"login" | "signup", { email: string; password: string; agree: boolean }> = {
  login: { email: "", password: "", agree: false },
  signup: { email: "", password: "", agree: false },
};

export function LoginStepOneForm({ mode = "login" }: LoginStepOneFormProps) {
  const FORM_STORAGE_KEY = mode === "signup" ? "cf_signup_form_values" : "cf_login_form_values";
  const LEGAL_RETURN_FLAG = "cf_auth_return_from_legal";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // OTP login state
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      sessionStorage.setItem("cf_pending_ref", ref.trim().toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (mode !== "signup") return;
    const raw = searchParams.get("email");
    if (!raw) return;
    const decoded = (() => {
      try {
        return decodeURIComponent(raw.trim());
      } catch {
        return raw.trim();
      }
    })();
    if (decoded) setEmail(decoded);
  }, [searchParams, mode]);

  useEffect(() => {
    let shouldRestore = false;
    try {
      shouldRestore = sessionStorage.getItem(LEGAL_RETURN_FLAG) === "1";
      if (shouldRestore) sessionStorage.removeItem(LEGAL_RETURN_FLAG);
    } catch {
      // ignore
    }

    const mem = authFormMemory[mode];
    if (shouldRestore && (mem.email || mem.password || mem.agree)) {
      setEmail(mem.email);
      setPassword(mem.password);
      setAgree(mem.agree);
      return;
    }

    try {
      const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        email: string;
        password: string;
        agree: boolean;
      }>;
      if (typeof parsed.email === "string") setEmail(parsed.email);
      if (typeof parsed.password === "string") setPassword(parsed.password);
      if (typeof parsed.agree === "boolean") setAgree(parsed.agree);
    } catch {
      // ignore
    }
  }, [FORM_STORAGE_KEY, LEGAL_RETURN_FLAG, mode]);

  useEffect(() => {
    authFormMemory[mode] = { email, password, agree };
    try {
      sessionStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify({ email, password, agree }),
      );
    } catch {
      // ignore
    }
  }, [FORM_STORAGE_KEY, email, password, agree, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !agree) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        if (!isPasswordStrong(password)) {
          setError(
            "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (!@#$%^&* etc.)."
          );
          return;
        }
        const response = await startSignup(email, password);
        if (response.success) {
          try { sessionStorage.removeItem(FORM_STORAGE_KEY); } catch { /* ignore */ }
          const otpRoute = `/otpverification?email=${encodeURIComponent(email)}`;
          router.prefetch(otpRoute);
          setIsLeaving(true);
          setTimeout(() => { router.push(otpRoute); }, 260);
        } else {
          setError(response.message || "Could not start signup. Please try again.");
        }
      } else {
        // Login mode: check if user has a password set
        const checkRes = await checkEmailRegistrationStatus(email);
        if (checkRes.success && checkRes.data?.exists && checkRes.data.hasPassword === false) {
          setOtpEmail(email);
          setOtpMode(true);
          setIsLoading(false);
          await handleSendOtp(email);
          return;
        }

        // Normal password login
        const response = await loginWithPassword(email, password);
        if (response.success && response.data?.token && response.data.user) {
          try { sessionStorage.removeItem(FORM_STORAGE_KEY); } catch { /* ignore */ }
          const normalizedUser = {
            ...response.data.user,
            name: response.data.user.name ?? undefined
          };
          login(response.data.token, normalizedUser);
          const target = normalizedUser.onboarding_completed ? "/" : "/step-1";
          router.prefetch(target);
          setIsLeaving(true);
          setTimeout(() => { router.replace(target); }, 220);
        } else {
          setError(response.message || "Login failed. Please check your credentials.");
        }
      }
    } catch (err) {
      setError(mode === "signup" ? "Unable to sign up right now. Please try again." : "An unexpected error occurred. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendOtp(overrideEmail?: string) {
    const target = overrideEmail || otpEmail || email;
    if (!target.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setOtpSending(true);
    try {
      const res = await sendOTP(target.trim().toLowerCase());
      if (res.success) {
        setOtpSent(true);
        setOtp(Array(OTP_LENGTH).fill(""));
        if (overrideEmail) setOtpEmail(overrideEmail);
      } else {
        setError(res.message || "Could not send verification code.");
      }
    } catch {
      setError("Could not send verification code. Please try again.");
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setOtpVerifying(true);
    setError(null);
    try {
      let pendingRef: string | undefined;
      try { pendingRef = sessionStorage.getItem("cf_pending_ref") || undefined; } catch { pendingRef = undefined; }

      const target = (otpEmail || email).trim().toLowerCase();
      const res = await verifyOTP(target, code, pendingRef);
      if (res.success && res.data?.token && res.data.user) {
        try { sessionStorage.removeItem("cf_pending_ref"); } catch { /* ignore */ }
        try { sessionStorage.removeItem(FORM_STORAGE_KEY); } catch { /* ignore */ }
        const normalizedUser = {
          ...res.data.user,
          name: res.data.user.name ?? undefined
        };
        login(res.data.token, normalizedUser);
        const target = normalizedUser.onboarding_completed ? "/" : "/step-1";
        router.prefetch(target);
        setIsLeaving(true);
        setTimeout(() => { router.replace(target); }, 220);
      } else {
        setError(res.message || "Invalid code. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, ev: React.KeyboardEvent<HTMLInputElement>) {
    if (ev.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < OTP_LENGTH; i++) {
      next[i] = pasted[i] || "";
    }
    setOtp(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH) - 1;
    if (focusIdx >= 0) otpRefs.current[focusIdx]?.focus();
  }

  function handleGoogleButtonClick() {
    initiateGoogleAuth(sessionStorage.getItem("cf_pending_ref") || undefined);
  }

  function handleFacebookButtonClick() {
    initiateFacebookAuth(sessionStorage.getItem("cf_pending_ref") || undefined);
  }

  function markLegalNavigation() {
    try { sessionStorage.setItem(LEGAL_RETURN_FLAG, "1"); } catch { /* ignore */ }
  }

  function resetOtpMode() {
    setOtpMode(false);
    setOtpSent(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpEmail("");
    setOtpSending(false);
    setError(null);
  }

  function handleManualOtpLogin() {
    setOtpEmail(email || "");
    setOtpMode(true);
    setOtpSent(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(null);
  }

  if (mode === "login" && otpMode) {
    return (
      <section
        className={`mx-auto w-full max-w-[460px] transform-gpu transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isLeaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="relative">
          <div className="hidden sm:block absolute -bottom-3 -left-3 z-0 h-full w-full rounded-[20px] bg-sky-200" />
          <div className="hidden sm:block absolute -top-3 -right-3 z-0 h-full w-full rounded-[20px] bg-[#f0c544]/60" />
          <div className="relative z-10 space-y-5 rounded-t-[32px] sm:rounded-[20px] border-t-2 sm:border-2 border-black bg-white p-6 pb-8 sm:p-7 text-start shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:shadow-sm">
            <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900">Login via OTP</p>
              <p className="text-sm text-slate-500">
                {otpSent
                  ? <>We&apos;ve sent a 6-digit code to <span className="font-semibold text-slate-700">{otpEmail}</span>.</>
                  : "Enter your email and we'll send you a one-time code to log in."}
              </p>
            </div>

            {!otpSent && (
              <div className="space-y-4">
                <div className="space-y-1.5 text-sm">
                  <label htmlFor="otp-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                    Email
                  </label>
                  <input
                    id="otp-email"
                    type="email"
                    required
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={otpSending || !otpEmail.trim()}
                  className={`landing-cta w-full rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${
                    otpSending ? "animate-pulse" : ""
                  }`}
                >
                  {otpSending ? "Sending..." : "Send verification code"}
                </button>
              </div>
            )}

            {otpSent && (
              <div className="space-y-4">
                <div className="flex gap-1.5 justify-center">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(ev) => handleOtpChange(i, ev.target.value.replace(/\D/g, ""))}
                      onKeyDown={(ev) => handleOtpKeyDown(i, ev)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="h-12 w-10 rounded-xl border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-slate-900"
                    />
                  ))}
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otp.join("").length !== OTP_LENGTH}
                  className={`landing-cta w-full rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${
                    otpVerifying ? "animate-pulse" : ""
                  }`}
                >
                  {otpVerifying ? "Verifying..." : "Login"}
                </button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={otpSending}
                    className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={resetOtpMode}
                    className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                  >
                    Use password instead
                  </button>
                </div>
              </div>
            )}

            <p className="pt-1 text-center text-xs text-slate-500">
              New here?{" "}
              <Link href="/signup" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`mx-auto w-full max-w-[460px] transform-gpu transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isLeaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative">
        <div className="hidden sm:block absolute -bottom-3 -left-3 z-0 h-full w-full rounded-[20px] bg-sky-200" />
        <div className="hidden sm:block absolute -top-3 -right-3 z-0 h-full w-full rounded-[20px] bg-[#f0c544]/60" />
        <form
          onSubmit={handleSubmit}
          className="relative z-10 space-y-5 rounded-t-[32px] sm:rounded-[20px] border-t-2 sm:border-2 border-black bg-white p-6 pb-8 sm:p-7 text-start shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:shadow-sm"
        >
          <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
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
        <div className="space-y-1.5 text-sm">
          <label
            htmlFor="password"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:border-slate-900"
            placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"}
          />
          {mode === "signup" && (
            <PasswordStrengthIndicator password={password} className="mt-2" />
          )}
          {mode === "login" && (
            <div className="flex justify-end pt-0.5">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-slate-600 transition hover:text-slate-900 underline underline-offset-2"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        {mode === "signup" && (
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
                onClick={markLegalNavigation}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-scribble-hover underline underline-offset-2 transition duration-300 hover:text-slate-900"
              >
                Terms of Use
              </Link>
              {" "}and{" "}
              <Link
                href="/legal#privacy-policy"
                onClick={markLegalNavigation}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-scribble-hover underline underline-offset-2 transition duration-300 hover:text-slate-900"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={
            !email ||
            !password ||
            (mode === "signup" && !agree) ||
            isLoading ||
            (mode === "signup" && !isPasswordStrong(password))
          }
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
              <span>{mode === "signup" ? "Sending OTP..." : "Logging in..."}</span>
            </span>
          ) : (
            mode === "signup" ? "Sign Up" : "Login"
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

        <div className="flex flex-row gap-2">
        <button
          type="button"
          onClick={handleGoogleButtonClick}
          disabled={isLoading}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:border-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center justify-center">
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
          </span>
        </button>

        <button
          type="button"
          onClick={handleFacebookButtonClick}
          disabled={isLoading}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:border-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center justify-center">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </span>
        </button>
        </div>

        {mode === "login" && (
          <button
            type="button"
            onClick={handleManualOtpLogin}
            className="w-full text-center text-xs font-semibold text-slate-600 transition hover:text-slate-900 underline underline-offset-2"
          >
            Login via OTP (Email)
          </button>
        )}

        {mode === "login" ? (
          <p className="pt-1 text-center text-xs text-slate-500">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
              Sign up
            </Link>
          </p>
        ) : (
          <p className="pt-1 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
              Login
            </Link>
          </p>
        )}
        </form>
      </div>
    </section>
  );
}
