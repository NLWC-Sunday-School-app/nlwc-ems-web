import "@nlwc/ui/tokens.css";
import "@nlwc/ui/components.css";
import "./portal.css";
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "NLWC Events", template: "%s · NLWC Events" },
  description: "Register for events at The New and Living Way Church.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-surface="public" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Marcellus&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Applies a saved theme before first paint so the page doesn't flash. */}
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('nlwc-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}" }} />
      </head>
      <body>
        <AuthProvider>
          <a className="sr skip" href="#main">Skip to content</a>
          <Header />
          <main id="main">
            <Suspense>{children}</Suspense>
          </main>
          <Footer />
          <TabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
