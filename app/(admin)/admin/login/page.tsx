'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { Logo } from '@/components/shared';
import { adminLogin } from '@/api';

export default function AdminLoginPage() {
  const router = useRouter();
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
      const response = await adminLogin(email, password);
      
      if (response.success && response.data) {
        // Store admin token and info in localStorage (for client-side)
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
        
        // Also set cookie for server-side access
        document.cookie = `admin_token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `admin_authenticated=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        
        router.push('/admin/site-users');
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Admin login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lightGradient flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Banner */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-darkGradient shadow-xl">
            <Logo 
              mode="dark" 
              darkSrc="/svgs/logo-white.svg"
              width={200}
              height={45}
            />
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Admin Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink focus:border-pink outline-none transition-all text-base bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink focus:border-pink outline-none transition-all text-base bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
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
              className="w-full bg-darkGradient text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg mt-8 text-base"
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
              className="text-pink hover:text-[#B903B8] inline-flex items-center gap-2 text-sm font-medium transition-colors"
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

