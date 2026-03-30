'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { Logo } from '@/components/shared';

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
      // Use same-origin /api so nginx (or Next rewrites) proxy to backend
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

        // Set cookie for server-side access (must be set before navigation)
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        document.cookie = `admin_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `admin_authenticated=true; path=/; max-age=${maxAge}; SameSite=Lax`;

        // Use full page navigation so the next request includes the new cookies.
        // router.push() triggers client-side navigation and the server may receive the old (empty) cookie state, causing immediate redirect to login.
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
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-5 shadow-sm">
            <Logo
              mode="light"
              width={240}
              height={54}
              className="h-[52px] w-auto max-w-[240px]"
            />
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {/* Title */}
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Admin Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none transition-all text-base bg-[#F6F8FA] focus:bg-white text-slate-900"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none transition-all text-base bg-[#F6F8FA] focus:bg-white text-slate-900"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#341050] hover:bg-[#2a0c40] text-white py-4 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-[#341050]/10 mt-8 text-base"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="text-[#341050] hover:text-[#2a0c40] inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <FiArrowLeft className="h-4 w-4" />
              Go back to College Finder website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

