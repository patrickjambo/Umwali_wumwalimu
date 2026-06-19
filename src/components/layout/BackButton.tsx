"use client";
import { useRouter } from "next/navigation";

// Instant client-side "go back" (gusubira inyuma).
// - `to` forces a fixed destination (always go there).
// - otherwise go to the previous page, falling back to `fallback`.
export function BackButton({
  label = "Gusubira inyuma",
  fallback = "/",
  to,
  className = "",
}: {
  label?: string;
  fallback?: string;
  to?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (to) {
          router.push(to);
        } else if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-3 py-1.5 text-sm text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      <span aria-hidden>←</span> {label}
    </button>
  );
}
