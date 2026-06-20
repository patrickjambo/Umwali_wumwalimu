"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Periodically refreshes the current route's server data so a list (e.g. the
// admin users table) reflects new signups without a manual reload.
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
