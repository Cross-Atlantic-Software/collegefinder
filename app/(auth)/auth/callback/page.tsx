"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser } from "@/api";
import { setAuthToken } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (error) {
      // Redirect to login with error
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (success === "true" && token) {
      // Store token first (so getCurrentUser can use it)
      setAuthToken(token);
      
      // Get user data and then login
      getCurrentUser()
        .then((response) => {
          if (response.success && response.data?.user) {
            const userData = response.data.user;
            // Use login method which stores both token and user
            login(token, userData);
            
            // Check if user has completed onboarding
            // If onboarding_completed is true → go to dashboard
            // If onboarding_completed is false/null → go to onboarding step-1
            if (userData.onboarding_completed) {
              router.push("/dashboard");
            } else {
              router.push("/step-1");
            }
          } else {
            router.push("/login?error=auth_failed");
          }
        })
        .catch((err) => {
          console.error('Error fetching user:', err);
          router.push("/login?error=auth_failed");
        });
    } else {
      router.push("/login?error=invalid_callback");
    }
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink mx-auto mb-4"></div>
        <p className="text-slate-200">Completing authentication...</p>
      </div>
    </div>
  );
}

