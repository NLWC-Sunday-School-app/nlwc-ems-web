import "@nlwc/ui/tokens.css";
import "@nlwc/ui/components.css";
import type { ReactNode } from "react";

export const metadata = { title: "NLWC Events" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-surface="public">
      <body>{children}</body>
    </html>
  );
}
