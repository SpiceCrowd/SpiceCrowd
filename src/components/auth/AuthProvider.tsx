"use client";

import { createContext, useContext, useState } from 'react';

type AuthUser = {
  token: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  authType?: 'email' | 'phone';
  name?: string;
  sessionExpiresAt?: number;
  id?: string;
  role?: string;
};

type LoginInput = {
  mode: 'email' | 'phone';
  email?: string;
  phone?: string;
  countryCode?: string;
  password?: string;
};

type RegisterInput = LoginInput & {
  name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithMethod: (input: LoginInput) => Promise<boolean>;
  registerWithMethod: (input: RegisterInput) => Promise<boolean>;
  updateProfile: (profile: { name: string; phone: string; countryCode: string }) => Promise<boolean>;
  logout: () => void;
};

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24;

function clearStoredSession() {
  localStorage.removeItem('sc_token');
  localStorage.removeItem('sc_user');
}

const initialUser =
  typeof window !== 'undefined'
    ? (() => {
        const token = window.localStorage.getItem('sc_token');
        const rawUser = window.localStorage.getItem('sc_user');
        if (!token) {
          return null;
        }
        if (!rawUser) {
          return { token };
        }
        try {
          const parsed = JSON.parse(rawUser) as Partial<AuthUser>;
          if (typeof parsed.sessionExpiresAt === 'number' && parsed.sessionExpiresAt <= Date.now()) {
            clearStoredSession();
            return null;
          }
          return { token, ...parsed };
        } catch {
          clearStoredSession();
          return null;
        }
      })()
    : null;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const saveSession = (nextUser: AuthUser) => {
    const sessionUser: AuthUser = {
      ...nextUser,
      sessionExpiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem('sc_token', sessionUser.token);
    localStorage.setItem('sc_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  const loginWithMethod = async (input: LoginInput) => {
    const email = (input.email || '').trim();
    if (!email || !email.includes('@')) {
      return false;
    }
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          phone: input.phone?.trim(),
          countryCode: input.countryCode?.trim(),
          password: input.password,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.token) {
        return false;
      }
      saveSession({ token: result.token, ...result.user, authType: input.mode });
      return true;
    } catch {
      return false;
    }
  };

  const registerWithMethod = async (input: RegisterInput) => {
    const email = (input.email || '').trim();
    if (!email || !email.includes('@')) {
      return false;
    }
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email,
          name: input.name?.trim(),
          phone: input.phone?.trim(),
          countryCode: input.countryCode?.trim(),
          password: input.password,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.token) {
        return false;
      }
      saveSession({ token: result.token, ...result.user, phone: input.phone, countryCode: input.countryCode, authType: input.mode });
      return true;
    } catch {
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    return loginWithMethod({ mode: 'email', email, password });
  };

  const register = async (name: string, email: string, password: string) => {
    return registerWithMethod({ mode: 'email', name, email, password });
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  const updateProfile = async (profile: { name: string; phone: string; countryCode: string }) => {
    if (!user) return false;
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${user.token}` },
        body: JSON.stringify(profile),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.user) return false;
      saveSession({ ...user, ...result.user });
      return true;
    } catch {
      return false;
    }
  };

  return <AuthContext.Provider value={{ user, login, register, loginWithMethod, registerWithMethod, updateProfile, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
