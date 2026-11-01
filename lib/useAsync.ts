"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { friendlyError } from "./api";

export interface Loaded<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (value: T) => void;
}

/** Loads on mount (and when <c>deps</c> change). Keeps the last data while reloading so the screen doesn't flash. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []): Loaded<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;
  const alive = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await loadRef.current();
      if (alive.current) setData(value);
    } catch (e) {
      if (alive.current) setError(friendlyError(e));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void reload();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload, setData };
}
