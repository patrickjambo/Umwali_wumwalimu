import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/layout/AuthChrome";
import { db } from "@/db";
import { courses, modules, quizAttempts } from "@/db/schema";
import { eq } from "drizzle-orm";

const categories = [
  {
    cat: "text" as const,
    tag: "Category A: Amategeko Rusange",
    desc: "Ibibazo by'amategeko gusa",
    href: "/courses/text",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
  },
  {
    cat: "numeric" as const,
    tag: "Category B: Ingero n'Ibipimo",
    desc: "Ibibazo birimo imibare",
    href: "/courses/numeric",
    icon: (
      <>
        <path d="M12 3v18M5 8h14M5 8l-2 5a3 3 0 006 0zM19 8l-2 5a3 3 0 006 0z" />
      </>
    ),
  },
  {
    cat: "ibyapa" as const,
    tag: "Category C: Ibyapa",
    desc: "Ibimenyetso (Road Signs)",
    href: "/courses/ibyapa",
    icon: (
      <>
        <path d="M12 2v4M7 22h10M12 18v4" />
        <path d="M9 6h6l-2 5h-2zM7 11h10l-2 5H9z" />
      </>
    ),
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const first = session?.user?.name?.split(" ")[0] || "Mukunzi";
  const userId = (session?.user as { id?: string } | undefined)?.id;

  // Progress per category = completed modules (Ibizamini done) / total modules.
  const [allCourses, allModules, userAttempts] = await Promise.all([
    db.select({ id: courses.id, category: courses.category }).from(courses),
    db.select({ id: modules.id, courseId: modules.courseId }).from(modules),
    userId
      ? db.select({ moduleId: quizAttempts.moduleId }).from(quizAttempts).where(eq(quizAttempts.userId, userId))
      : Promise.resolve([] as { moduleId: string }[]),
  ]);
  const doneModules = new Set(userAttempts.map((a) => a.moduleId));
  const pctFor = (cat: string) => {
    const course = allCourses.find((c) => c.category === cat);
    if (!course) return 0;
    const mods = allModules.filter((m) => m.courseId === course.id);
    if (mods.length === 0) return 0;
    const done = mods.filter((m) => doneModules.has(m.id)).length;
    return Math.round((done / mods.length) * 100);
  };

  return (
    <div className="space-y-7">
      {/* Greeting + security status */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="hud glass relative flex-1 rounded-2xl p-6">
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Muraho, {first}!</h1>
          <p className="mt-1.5 text-sm text-cyan-100/65">Wiyandikishije kugira ngo wige amategeko y&apos;umuhanda.</p>
        </div>
        <div className="rounded-2xl glass-soft p-4 lg:w-72">
          <p className="mb-2.5 text-xs font-semibold text-cyan-200">System Security Status</p>
          <div className="space-y-1.5 text-[11px] text-cyan-100/70">
            <div className="flex items-center justify-between"><span>Multi-Factor Auth</span><span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-semibold text-emerald-300">active</span></div>
            <div className="flex items-center justify-between"><span>Data Encryption</span><span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-semibold text-emerald-300">active</span></div>
            <div className="flex items-center justify-between pt-0.5"><span>Status</span><span className="font-semibold text-emerald-300">Active</span></div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white">Ibizamini Uheruka Gukora</h2>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const pct = pctFor(c.cat);
          return (
          <div key={c.href} className="hud glass is-interactive relative flex flex-col rounded-2xl p-6 transition-all">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{c.tag}</h3>
                <p className="mt-1 text-xs text-cyan-100/60">{c.desc}</p>
              </div>
              <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-cyan-300/80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {c.icon}
              </svg>
            </div>

            <div className="mb-5 flex items-center gap-4">
              <ProgressRing value={pct} size={72} />
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pct >= 100 ? "bg-emerald-400/20 text-emerald-200" : "bg-cyan-400/15 text-cyan-200"}`}>
                {pct >= 100 ? "Byarangiye ✓" : pct > 0 ? "Birakomeza" : "Active"}
              </span>
            </div>

            <Link href={c.href} className="mt-auto block">
              <Button className="glow-btn h-10 w-full rounded-xl bg-gradient-to-r from-cyan-500/90 to-sky-600/90 font-semibold text-white hover:from-cyan-400 hover:to-sky-500">
                Komeza Kwiga ⏵
              </Button>
            </Link>
          </div>
          );
        })}
      </div>
    </div>
  );
}
