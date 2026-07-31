import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import type { Me } from '../types';
import { getStartInviteCode, initTelegramApp } from '../telegram/webapp';

type AuthContextValue = {
  me: Me | null;
  loading: boolean;
  error: string | null;
  inviteCode: string | null;
  refresh: () => Promise<void>;
  setMe: (me: Me | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode] = useState<string | null>(() => getStartInviteCode());

  const refresh = useCallback(async () => {
    const data = await api<Me>('/me');
    setMe(data);
  }, []);

  useEffect(() => {
    initTelegramApp();
    refresh()
      .catch((e: Error) => setError(e.message || 'Не удалось войти'))
      .finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo(
    () => ({ me, loading, error, inviteCode, refresh, setMe }),
    [me, loading, error, inviteCode, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
