"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/dashboard",
    label: "Ahabanza (Dashboard)",
    icon: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  },
  {
    href: "/courses",
    label: "Amasomo (Courses)",
    icon: <path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2zM18 3v18" />,
  },
  {
    href: "/certificates",
    label: "Ibyemezo (Certificates)",
    icon: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path d="M9 13l-1 7 4-2 4 2-1-7" />
      </>
    ),
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/dashboard" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              active
                ? "glass-soft font-semibold text-white ring-accent"
                : "text-cyan-100/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <svg viewBox="0 0 24 24" className={cn("h-5 w-5", active ? "text-cyan-300" : "text-cyan-100/50")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {it.icon}
            </svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
