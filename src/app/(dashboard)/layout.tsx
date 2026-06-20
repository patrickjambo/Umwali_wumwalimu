import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { TechBackground } from "@/components/layout/TechBackground";
import { accessActive, daysRemaining, SUPPORT_PHONE } from "@/lib/access";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id?: string } | undefined)?.id;
  const row = userId
    ? (await db.select({ role: users.role, isActive: users.isActive, exp: users.accessExpiresAt }).from(users).where(eq(users.id, userId)).limit(1))[0]
    : undefined;
  const isAdmin = row?.role === "admin";
  const active = accessActive({ role: row?.role, isActive: row?.isActive, accessExpiresAt: row?.exp });
  const remaining = daysRemaining(row?.exp);

  const name = session.user?.name || "Mukunzi";
  const initial = name.charAt(0).toUpperCase();

  const signOutAction = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/login" });
  };

  // Access expired / deactivated (students only) -> show renewal screen.
  if (!active && !isAdmin) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-cyan-50">
        <TechBackground variant="network" />
        <div className="hud glass relative z-10 max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-400/15 text-2xl text-amber-300">⏳</div>
          <h1 className="text-glow text-2xl font-bold text-white">Igihe cyawe cyararangiye</h1>
          <p className="mt-3 text-sm text-cyan-100/70">
            Igihe cyo kwiga cyararangiye. Kugira ngo ukomeze ukoreshe sisitemu, hamagara cyangwa wandikire kuri:
          </p>
          <a href={`tel:${SUPPORT_PHONE}`} className="mt-4 inline-flex items-center gap-2 rounded-xl glass-soft px-5 py-2.5 text-lg font-bold text-cyan-200">
            📞 {SUPPORT_PHONE}
          </a>
          <p className="mt-3 text-xs text-cyan-100/55">Umuyobozi azakongerera iminsi / ibyumweru / amezi nyuma yo kumvikana.</p>
          <form action={signOutAction} className="mt-6">
            <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-4 text-sm text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white">
              Sohoka ⏻
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-cyan-50">
      <TechBackground variant="network" />
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-cyan-400/15 bg-[#06121d]/70 px-5 backdrop-blur-md lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
          <span className="hidden text-sm text-cyan-100/45 sm:inline">Advanced Platform</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {isAdmin ? (
            <span className="hidden rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300 sm:inline">Admin</span>
          ) : (
            <span
              className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline ${
                remaining <= 1 ? "bg-amber-400/15 text-amber-300" : "bg-cyan-400/15 text-cyan-200"
              }`}
              title="Iminsi isigaye"
            >
              {remaining} {remaining === 1 ? "umunsi" : "iminsi"} isigaye
            </span>
          )}
          <span className="hidden h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white sm:grid">
            {initial}
          </span>
          <span className="hidden text-sm font-medium text-cyan-100/85 sm:inline">{name}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-3 text-sm text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              Sohoka ⏻
            </button>
          </form>
        </div>
      </header>

      <div className="relative z-10 flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-cyan-400/12 p-4 md:block">
          <DashboardNav isAdmin={isAdmin} />
        </aside>

        <main className="flex-1 p-5 md:p-8 lg:p-10">{children}</main>
      </div>

      <footer className="relative z-10 border-t border-cyan-400/10 px-6 py-4 text-center">
        <p className="text-xs text-cyan-100/45">© 2026 Amategeko y&apos;Umuhanda Advanced Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
