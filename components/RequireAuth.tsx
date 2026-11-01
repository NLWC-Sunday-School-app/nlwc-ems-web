"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Loading } from "./Form";

/** Signed-out visitors go to /login and come back here afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(search ? `${pathname}?${search}` : pathname)}`);
  }, [status, router, pathname, search]);

  if (status !== "authenticated") return <div className="container"><Loading label="Checking your session…" /></div>;
  return <>{children}</>;
}
