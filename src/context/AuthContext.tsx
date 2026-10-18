import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email: string;
  role?: string;
  photoURL?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (profile?: Partial<UserProfile>) => void;
  logout: () => void;
  updateUser: (profile: Partial<UserProfile>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'oceanembed_auth';
const USER_KEY = 'oceanembed_user';

const DEFAULT_USER: UserProfile = {
  name: 'Aditya Das',
  email: 'aditya@oceanembed.ai',
  role: 'Lead Oceanographer',
};

const getInitialUser = (isAuth: boolean): UserProfile | null => {
  if (!isAuth) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_USER;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise from localStorage so the session survives a page refresh.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const [user, setUser] = useState<UserProfile | null>(() =>
    getInitialUser(localStorage.getItem(STORAGE_KEY) === 'true')
  );

  const login = useCallback((profile?: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      name: profile?.name || DEFAULT_USER.name,
      email: profile?.email || DEFAULT_USER.email,
      role: profile?.role || DEFAULT_USER.role,
      photoURL: profile?.photoURL,
    };
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((profile: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...(prev || DEFAULT_USER), ...profile };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Convenience hook. Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
