import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession } from '../types';
import { clearAuthToken, setAuthToken } from '../api/client';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  shiftRemainingFormatted: string;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: (reason?: string) => void;
}

const TOKEN_KEY = 'vce_auth_token';
const USER_KEY = 'vce_auth_user';
const EXPIRES_AT_KEY = 'vce_auth_expires_at';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [shiftRemainingFormatted, setShiftRemainingFormatted] = useState<string>('8h 0m');

  const calculateShiftRemaining = useCallback((): string => {
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (!expiresAt) return '8h 0m';
    const expireTime = new Date(expiresAt).getTime();
    if (isNaN(expireTime)) return '8h 0m';

    const diff = expireTime - Date.now();
    if (diff <= 0) return 'Expired';

    const totalSecs = Math.floor(diff / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  const logout = useCallback((reason?: string) => {
    clearAuthToken();
    setTokenState(null);
    setUserState(null);
    const redirectUrl = reason ? `/login?${reason}=1` : '/login';
    window.location.href = redirectUrl;
  }, []);

  // Shift countdown timer effect
  useEffect(() => {
    if (!token) return;

    setShiftRemainingFormatted(calculateShiftRemaining());

    const timer = setInterval(() => {
      const remaining = calculateShiftRemaining();
      setShiftRemainingFormatted(remaining);
      if (remaining === 'Expired') {
        logout('expired');
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [token, calculateShiftRemaining, logout]);

  const login = async ({ username, password }: { username: string; password: string }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Invalid username or password';
      try {
        const err = await res.json();
        if (typeof err.detail === 'string') {
          errorMsg = err.detail;
        } else if (Array.isArray(err.detail) && err.detail.length > 0) {
          errorMsg = err.detail
            .map((e: any) => e.msg || e.message || (typeof e === 'string' ? e : JSON.stringify(e)))
            .join('; ');
        } else if (err.message && typeof err.message === 'string') {
          errorMsg = err.message;
        }
      } catch {
        errorMsg = res.statusText || 'Login failed';
      }
      throw new Error(errorMsg);
    }

    const data: AuthSession = await res.json();
    setAuthToken(data.access_token);
    setTokenState(data.access_token);

    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUserState(data.user);
    }

    // Set 8-hour shift expiration
    const expiry = data.expires_at || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(EXPIRES_AT_KEY, expiry);
    setShiftRemainingFormatted(calculateShiftRemaining());
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        shiftRemainingFormatted,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
