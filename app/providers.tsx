"use client";

import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SessionProvider>
        {children}
        <Toaster richColors position="top-right" />
      </SessionProvider>
    </ThemeProvider>
  );
}
