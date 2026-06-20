import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TechBackground } from "@/components/layout/TechBackground";

const navItems = [
  { href: "/admin", label: "Abakoresha (Users)" },
  { href: "/admin/questions", label: "Ibibazo (Questions)" },
  { href: "/admin/certificates", label: "Ibyemezo (Certificates)" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as { role?: string } | undefined)?.role !== "admin") {
    redirect("/dashboard");
  }

  const signOutAction = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-cyan-50">
      <TechBackground variant="network" />
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-cyan-400/15 bg-[#06121d]/70 px-5 backdrop-blur-md lg:px-8">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-white">Amategeko Admin</span>
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard" className="hidden text-sm text-cyan-100/70 hover:text-white sm:inline">Ahabanza</Link>
          <span className="hidden text-sm font-medium text-cyan-100/85 sm:inline">{session.user?.name}</span>
          <form action={signOutAction}>
            <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-3 text-sm text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white">
              Sohoka ⏻
            </button>
          </form>
        </div>
      </header>

      <div className="relative z-10 flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-cyan-400/12 p-4 md:block">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((it) => (
              <Link key={it.href} href={it.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cyan-100/70 transition-all hover:bg-white/5 hover:text-white">
                {it.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-5 md:p-8 lg:p-10">{children}</main>
      </div>

      <footer className="relative z-10 border-t border-cyan-400/10 px-6 py-4 text-center">
        <p className="text-xs text-cyan-100/45">© 2026 Amategeko y&apos;Umuhanda Admin. All rights reserved.</p>
      </footer>
    </div>
  );
}
