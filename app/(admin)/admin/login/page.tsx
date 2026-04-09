'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const apiBase = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const text = await res.text();
      let data: { success?: boolean; message?: string; data?: { token?: string; admin?: unknown } } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError('Invalid response from server. Please try again.');
        return;
      }

      if (res.ok && data.success && data.data?.token && data.data?.admin) {
        const { token, admin } = data.data;

        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_user', JSON.stringify(admin));

        const maxAge = 60 * 60 * 24 * 7;
        document.cookie = `admin_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `admin_authenticated=true; path=/; max-age=${maxAge}; SameSite=Lax`;

        const isSuperAdmin = (admin as { type?: string })?.type === 'super_admin';
        window.location.href = isSuperAdmin ? '/admin/site-users' : '/admin';
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden text-slate-900">
      <Image
        src="/login.png"
        alt="Admin login background"
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-white/74 backdrop-blur-[1px]" />

      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/92 px-6 py-3.5 backdrop-blur-md">
        <Link href="/" className="block">
          <Image
            src="/svgs/logo-unitracko.svg"
            alt="UniTracko"
            width={148}
            height={33}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <span className="rounded-full border border-slate-200 bg-[#F6F8FA] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#341050]">
          Admin
        </span>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px] space-y-2">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin login</h1>
            <p className="mt-1 text-sm text-slate-600">Sign in with your CMS credentials.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
              >
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <FiMail className="h-[18px] w-[18px] text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#341050] focus:ring-2 focus:ring-[#341050]/20"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <FiLock className="h-[18px] w-[18px] text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#341050] focus:ring-2 focus:ring-[#341050]/20"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="h-[18px] w-[18px]" /> : <FiEye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#341050] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#341050]/15 transition hover:bg-[#2a0c40] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                'Signing in…'
              ) : (
                <>
                  Sign in
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#341050] transition hover:text-[#2a0c40]"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to website
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
