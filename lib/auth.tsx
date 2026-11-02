"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, SESSION_ENDED, api } from "./api";
import type { LoginResult, Me } from "./types";

type Status = "loading" | "anonymous" | "authenticated";

/** Just enough of the profile to say who is signed in (header, menus). */
export interface Who { givenName: string; familyName: string; email: string }

interface AuthState {
  status: Status;
  me: Me | null;
  /** Name and email of the signed-in person, once loaded. */
  who: Who | null;
  /** Reloads the session. Call after anything that changes it (sign-in, verifying email). */
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [who, setWho] = useState<Who | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await api.get<Me>("/auth/me"));
      setStatus("authenticated");
      // The name is nice to have; the page works without it, so a failure here is not a sign-out.
      api.get<Who>("/profile").then(setWho).catch(() => undefined);
    } catch (e) {
      const ended = e instanceof ApiError && e.status === 401; // the normal "not signed in"
      if (!ended) console.warn("Could not load the session", e);
      // A real 401 signs the person out. Anything else (network blip, 5xx) must not boot someone who is signed in; it only
      // decides the first answer, when nothing is known yet.
      if (ended) {
        setMe(null);
        setWho(null);
      }
      setStatus((s) => (ended ? "anonymous" : s === "loading" ? "anonymous" : s));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    // Any call that comes back 401 means the session ended: show the signed-out state (guarded pages then go to /login).
    const ended = () => {
      setMe(null);
      setWho(null);
      setStatus("anonymous");
    };
    // A tab left open overnight still looks signed in. Check again when the person comes back to it, before they fill in a form.
    const back = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener(SESSION_ENDED, ended);
    document.addEventListener("visibilitychange", back);
    return () => {
      window.removeEventListener(SESSION_ENDED, ended);
      document.removeEventListener("visibilitychange", back);
    };
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

  const value = useMemo(() => ({ status, me, who, refresh, login, logout }), [status, me, who, refresh, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
