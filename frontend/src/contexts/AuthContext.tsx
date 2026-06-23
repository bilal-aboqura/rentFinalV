import { createContext, useContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminLogin, adminLogout, fetchCurrentAdmin } from '../services/admin';
import type { AdminUserDTO } from '../types';

interface AuthContextValue {
  user: AdminUserDTO | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentAdmin()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const nextUser = await adminLogin(username, password);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
