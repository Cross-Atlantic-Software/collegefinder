'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, getCurrentUser } from '@/api';
import { getAuthToken, setAuthToken, setUser, removeAuthToken, getUser as getStoredUser } from '@/lib/auth';
import LogoutLoader from '@/components/shared/LogoutLoader';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  /** True once we've fetched user from server (or confirmed no token). Use this before redirecting to step-1 so we don't use stale localStorage. */
  userVerifiedFromServer: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userVerifiedFromServer, setUserVerifiedFromServer] = useState(false);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      const storedUser = getStoredUser();

      if (token && storedUser) {
        setUserState(storedUser);
        // Verify token and get fresh user from server before trusting onboarding_completed
        try {
          const response = await getCurrentUser();
          if (response.success && response.data) {
            setUserState(response.data.user);
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          // Keep stored user even if API call fails - never auto-logout
        }
        setUserVerifiedFromServer(true);
      } else {
        setUserVerifiedFromServer(true);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
    setUserState(userData);
    setUserVerifiedFromServer(true); // Login response is from server
  };

  const logout = () => {
    setIsLoggingOut(true);
    // Small delay for smooth transition
    setTimeout(() => {
      removeAuthToken();
      setUserState(null);
      setIsLoggingOut(false);
      router.replace('/login');
    }, 300);
  };

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUserState(response.data.user);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggingOut,
    isAuthenticated: !!user,
    userVerifiedFromServer,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoggingOut && <LogoutLoader />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

