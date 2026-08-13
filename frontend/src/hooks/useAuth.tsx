'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { getStoredUser, setAuth, clearAuth, googleAuth, emailAuth, switchRole as apiSwitchRole } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (googleData: { google_id: string; email: string; name: string; avatar_url?: string }) => Promise<void>;
  loginWithEmail: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  switchRole: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (googleData: {
    google_id: string;
    email: string;
    name: string;
    avatar_url?: string;
  }) => {
    const response = await googleAuth(googleData);
    setAuth(response.user, response.token);
    setUser(response.user);
  }, []);

  const loginWithEmail = useCallback(async (email: string, name?: string) => {
    const response = await emailAuth({ email, name });
    setAuth(response.user, response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const switchRole = useCallback(async () => {
    const updated = await apiSwitchRole();
    setAuth(updated, localStorage.getItem('airbnb_token') || '');
    setUser(updated);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setAuth(updatedUser, localStorage.getItem('airbnb_token') || '');
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      loginWithEmail,
      logout,
      switchRole,
      updateUser,
    }}>
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
