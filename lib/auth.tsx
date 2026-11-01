"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api } from "./api";
import type { LoginResult, Me } from "./types";

type Status = "loading" | "anonymous" | "authenticated";

interface AuthState {
  status: Status;
  me: Me | null;
  /** Reloads the session. Call after anything that changes it (sign-in, verifying email). */
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Me | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await api.get<Me>("/auth/me"));
      setStatus("authenticated");
    } catch (e) {
      // 401 is the normal "not signed in". Anything else (network, 5xx) also leaves the person signed out in the UI.
      if (!(e instanceof ApiError) || e.status !== 401) console.warn("Could not load the session", e);
      setMe(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<LoginResult>("/auth/login", { email, password, surface: "Web" });
      await refresh();
      return result;
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      // A full navigation, not a client one: it drops everything held in memory (health answers included) and cannot
      // race with a guarded page redirecting to /login.
      window.location.assign("/events");
    }
  }, []);

  const value = useMemo(() => ({ status, me, refresh, login, logout }), [status, me, refresh, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
