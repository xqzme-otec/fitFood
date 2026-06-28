"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/AppShell";

export default function RootPage() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (!user.is_profile_complete) router.replace("/onboarding");
    else router.replace("/today");
  }, [ready, user, router]);

  return <LoadingScreen />;
}
