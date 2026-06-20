"use client";
import { ColorModeProvider } from "@/lib/colorMode";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ColorModeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ColorModeProvider>
  );
}
