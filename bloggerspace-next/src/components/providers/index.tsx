"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
      <QueryProvider>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast: "rounded-lg border-border",
            },
          }}
        />
      </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
