"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { requestPasswordReset } from "@/api";
import { AuthShell } from "@/components/auth";
import { Logo } from "@/components/shared";
import OnboardingLoader from "@/components/shared/OnboardingLoader";

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resetData, setResetData] = useState<{
    resetLink?: string;
    emailDelivered?: boolean;
    devHint?: string;
    devSkipReason?: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <OnboardingLoader message="Redirecting..." />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(email.trim().toLowerCase());
      if (res.success) {
        setResetData(res.data ?? null);
        setDone(true);
      } else {
        setError(res.message || "Something went wrong.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell variant="minimal" showMinimalHeader={false} contentClassName="items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center gap-6 px-4">
        <Logo mode="light" width={190} height={42} className="h-auto w-[170px] sm:w-[190px]" />
        <section className="mx-auto w-full max-w-[460px] rounded-3xl border border-slate-200 bg-white p-6 text-start shadow-sm sm:p-8">
          <h1 className="text-lg font-semibold text-slate-900">Forgot password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the email on your UniTracko account. We send a reset link only if that email is verified (including
            Google/Facebook sign-in, so you can set an email password).
          </p>

          {done ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                If an account exists for that email, we sent a password reset link. Check your inbox and spam folder. The
                link expires in about an hour.
              </div>
              {resetData?.devSkipReason && resetData.devHint && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-semibold">Local development (why no email was sent)</p>
                  <p className="mt-1 text-amber-900/90">{resetData.devHint}</p>
                </div>
              )}
              {resetData?.resetLink && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-semibold">Development / fallback</p>
                  {resetData.devHint && <p className="mt-1 text-amber-900/90">{resetData.devHint}</p>}
                  {resetData.emailDelivered === false && (
                    <p className="mt-2 text-amber-900/90">
                      SMTP did not send the message. Open the link below to set a new password, or fix{" "}
                      <code className="rounded bg-amber-100 px-1">EMAIL_HOST</code>, <code className="rounded bg-amber-100 px-1">EMAIL_USER</code>, and{" "}
                      <code className="rounded bg-amber-100 px-1">EMAIL_PASS</code> in the backend{" "}
                      <code className="rounded bg-amber-100 px-1">.env</code> (Gmail needs an app password if 2FA is on).
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                      href={resetData.resetLink}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      Open reset page
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(resetData.resetLink!);
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-amber-400 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-100"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              )}
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="space-y-1.5 text-sm">
                <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="landing-cta inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
              <p className="text-center text-xs text-slate-500">
                <Link href="/login" className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900">
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </section>
      </div>
    </AuthShell>
  );
}
