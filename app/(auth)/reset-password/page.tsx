"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resetPasswordWithToken } from "@/api";
import { AuthShell } from "@/components/auth";
import { Logo } from "@/components/shared";
import OnboardingLoader from "@/components/shared/OnboardingLoader";
import { PasswordStrengthIndicator } from "@/components/admin/PasswordStrengthIndicator";
import { isPasswordStrong } from "@/lib/passwordStrength";
import { FiEye, FiEyeOff } from "react-icons/fi";

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="relative">
        <div className="hidden sm:block absolute -bottom-3 -left-3 z-0 h-full w-full rounded-[20px] bg-sky-200" />
        <div className="hidden sm:block absolute -top-3 -right-3 z-0 h-full w-full rounded-[20px] bg-[#f0c544]/60" />
        <section className="relative z-10 rounded-t-[32px] sm:rounded-[20px] border-t-2 sm:border-2 border-black bg-white p-6 pb-8 sm:p-7 text-start shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:shadow-sm">
          <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
          {children}
        </section>
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token")?.trim() || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    token.length >= 16 && isPasswordStrong(newPassword) && newPassword === confirm && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await resetPasswordWithToken(token, newPassword, confirm);
      if (res.success) {
        setDone(true);
        setTimeout(() => router.replace("/login"), 2200);
      } else {
        setError(res.message || "Could not reset password.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthFrame>
        <h1 className="text-lg font-semibold text-slate-900">Invalid link</h1>
        <p className="mt-2 text-sm text-slate-600">This reset link is missing a token. Request a new link from the login page.</p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Request reset link
        </Link>
      </AuthFrame>
    );
  }

  if (done) {
    return (
      <AuthFrame>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Your password was updated. Redirecting you to sign in…
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <h1 className="text-lg font-semibold text-slate-900">Set a new password</h1>
      <p className="mt-1 text-sm text-slate-500">Choose a strong password you have not used elsewhere.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-1.5 text-sm">
          <label htmlFor="new-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={newPassword} className="mt-2" />
        </div>

        <div className="space-y-1.5 text-sm">
          <label htmlFor="confirm-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`block w-full rounded-2xl border bg-white px-4 py-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 ${
                confirm.length > 0 && newPassword !== confirm ? "border-red-300" : "border-slate-300"
              }`}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="landing-cta inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
        <p className="text-center text-xs text-slate-500">
          <Link href="/login" className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900">
            Back to login
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export default function ResetPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <OnboardingLoader message="Redirecting..." />;
  }

  return (
    <AuthShell variant="minimal" showMinimalHeader={false} contentClassName="items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center gap-6 px-4">
        <Logo mode="light" width={190} height={42} className="h-auto w-[170px] sm:w-[190px]" />
        <Suspense fallback={<OnboardingLoader message="Loading…" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthShell>
  );
}
