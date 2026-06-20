"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, auth as tokenStore } from "./api";
import type { MealSlot, NutritionTarget, Profile, User } from "./types";

interface AuthState {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  targets: NutritionTarget | null;
  meals: MealSlot[];
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
  reloadTargets: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY: AuthState = { ready: false, user: null, profile: null, targets: null, meals: [] };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY);

  const loadAll = useCallback(async () => {
    if (!tokenStore.isAuthed) {
      setState({ ...EMPTY, ready: true });
      return;
    }
    try {
      const user = await api.me();
      if (!user.is_profile_complete) {
        setState({ ready: true, user, profile: null, targets: null, meals: [] });
        return;
      }
      const [profile, targets, meals] = await Promise.all([
        api.getProfile(),
        api.getTargets(),
        api.getMeals(),
      ]);
      setState({ ready: true, user, profile, targets, meals });
    } catch {
      tokenStore.logout();
      setState({ ...EMPTY, ready: true });
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const login = useCallback(
    async (email: string, password: string) => {
      await api.login(email, password);
      await loadAll();
    },
    [loadAll],
  );

  const register = useCallback(async (email: string, password: string) => {
    await api.register(email, password);
  }, []);

  const logout = useCallback(() => {
    tokenStore.logout();
    setState({ ...EMPTY, ready: true });
  }, []);

  const reloadTargets = useCallback(async () => {
    const [targets, meals, profile] = await Promise.all([
      api.getTargets(),
      api.getMeals(),
      api.getProfile(),
    ]);
    setState((s) => ({ ...s, targets, meals, profile }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout, reloadUser: loadAll, reloadTargets }),
    [state, login, register, logout, loadAll, reloadTargets],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
