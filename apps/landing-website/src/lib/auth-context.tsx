// lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { getCurrentUser, loginUser, registerUser, logoutUser } from './api';
import type { LoginCredentials, RegisterData, AuthResponse, ApiResponse } from "@fixmate/shared-types";
import type { BaseUser } from '@fixmate/shared-types';

interface AuthContextType {
  user: BaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthResponse>>;
  register: (data: RegisterData) => Promise<ApiResponse<AuthResponse>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
      if (token) {
        const userData = await getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await loginUser(credentials);
    if (!response?.data) {
      throw new Error('Invalid login response');
    }
    return response;
  };

  const register = async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await registerUser(data);
    if (!response?.data) {
      throw new Error('Invalid registration response');
    }
    return response;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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