import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/layout/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const name = session.user?.name || "Mukunzi";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="tech-bg tech-grid relative flex min-h-screen flex-col overflow-hidden">
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-cyan-400/15 bg-[#06121d]/70 px-5 backdrop-blur-md lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
          <span className="hidden text-sm text-cyan-100/45 sm:inline">Advanced Platform</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white sm:grid">
            {initial}
          </span>
          <span className="hidden text-sm font-medium text-cyan-100/85 sm:inline">{name}</span>
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/lib/auth");
              await signOut({ redirectTo: "/login" });
            }}
          >
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
          <DashboardNav />
        </aside>

        <main className="flex-1 p-5 md:p-8 lg:p-10">{children}</main>
      </div>

      <footer className="relative z-10 border-t border-cyan-400/10 px-6 py-4 text-center">
        <p className="text-xs text-cyan-100/45">© 2026 Amategeko y&apos;Umuhanda Advanced Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
