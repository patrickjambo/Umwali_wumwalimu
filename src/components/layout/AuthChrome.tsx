import * as React from "react";

/** Circular progress donut (decorative HUD element). */
export function ProgressRing({ value, size = 92 }: { value: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(56,189,248,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringgrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{value}%</span>
    </div>
  );
}

function StatusRow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 p-2.5 text-center">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9.5 12l1.8 1.8L15 10" />
      </svg>
      <span className="text-[11px] leading-tight text-cyan-100/75">{label}</span>
      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">active</span>
    </div>
  );
}

/** Multi-Factor Auth / Data Encryption status panel. */
export function SecurityStatus() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatusRow label="Multi-Factor Auth" />
      <StatusRow label="Data Encryption" />
    </div>
  );
}

/** "Recommended next step" pill. */
export function NextStep({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 ring-accent transition-colors hover:bg-white/10">
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 12l3 3 5-6" />
      </svg>
      <span className="text-xs font-medium text-cyan-100/85">{title}</span>
    </div>
  );
}

/** Small left-aligned icon for an input field. */
export function fieldIcon(name: "user" | "mail" | "lock") {
  const paths: Record<string, React.ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20a6.5 6.5 0 0113 0" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 018 0v3" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-cyan-300/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      {paths[name]}
    </svg>
  );
}
