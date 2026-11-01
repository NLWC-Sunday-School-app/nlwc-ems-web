"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

/** Phone navigation. The shared CSS only shows it under 720px. */
export function TabBar() {
  const pathname = usePathname();
  const { status } = useAuth();
  const items = [
    { href: "/events", label: "Events" },
    ...(status === "authenticated"
      ? [
          { href: "/dashboard", label: "My events" },
          { href: "/children", label: "Children" },
          { href: "/profile", label: "Profile" },
        ]
      : [{ href: "/login", label: "Sign in" }]),
  ];
  return (
    <nav className="tabbar" aria-label="Mobile">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={pathname === i.href || pathname.startsWith(`${i.href}/`) ? "on" : undefined} aria-current={pathname === i.href ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
