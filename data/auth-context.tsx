import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, apiLogout, apiGetMe, getCachedUser, getToken } from '@/data/api';
import { runSync } from '@/data/sync';
import { clearAllUserData, getSyncMeta, setSyncMeta } from '@/data/database';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  avatar_original_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birth_date: string | null;
  goal: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserData = useCallback(async (userId: string) => {
    try {
      const lastId = await getSyncMeta('last_user_id');
      if (lastId && lastId !== userId) {
        await clearAllUserData();
      }
      await setSyncMeta('last_user_id', userId);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
         
          const cached = await getCachedUser();
          if (cached) {
            await ensureUserData(cached.id);
            setUser(cached);
          }
          try {
            const fresh = await apiGetMe();
            await ensureUserData(fresh.id);
            setUser(fresh);
            runSync().catch((e) => console.warn('[Sync] startup error:', e));
          } catch (err: any) {
            console.warn('[Auth] apiGetMe failed, keeping cached user:', err?.message || err);
            if (!cached) {
              await apiLogout();
              await clearAllUserData().catch(() => {});
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('[Auth] init error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    await ensureUserData(data.user.id);
    setUser(data.user);
    runSync().catch(() => {});
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await apiRegister(email, password, name);
    await ensureUserData(data.user.id);
    setUser(data.user);
    runSync().catch(() => {});
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    await clearAllUserData().catch(() => {});
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await apiGetMe();
      setUser(fresh);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
