'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, getCurrentUser } from '@/lib/api';
import { getAuthToken, setAuthToken, setUser, removeAuthToken, getUser as getStoredUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      const storedUser = getStoredUser();

      if (token && storedUser) {
        setUserState(storedUser);
        
        // Verify token is still valid in the background (silently update user data)
        // Never automatically log out - only logout button can log out
        try {
          const response = await getCurrentUser();
          if (response.success && response.data) {
            // Update with fresh data from server
            setUserState(response.data.user);
            setUser(response.data.user);
          }
          // If API call fails, keep the stored user - don't log out
        } catch (error) {
          console.error('Error verifying token:', error);
          // Keep stored user even if API call fails - never auto-logout
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
    setUserState(userData);
  };

  const logout = () => {
    removeAuthToken();
    setUserState(null);
    router.push('/login');
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
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

