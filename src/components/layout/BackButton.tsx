"use client";
import { useRouter } from "next/navigation";

// Instant client-side "go back" (gusubira inyuma). Falls back to a given
// route when there's no history (e.g. opened via a direct link).
export function BackButton({
  label = "Gusubira inyuma",
  fallback = "/",
  className = "",
}: {
  label?: string;
  fallback?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-3 py-1.5 text-sm text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      <span aria-hidden>←</span> {label}
    </button>
  );
}
