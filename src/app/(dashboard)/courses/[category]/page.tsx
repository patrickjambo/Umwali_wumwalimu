import { db } from "@/db";
import { courses, modules } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/BackButton";
import { notFound } from "next/navigation";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const p = await params;
  const validCategories = ["text", "numeric", "ibyapa"];
  if (!validCategories.includes(p.category)) {
    notFound();
  }

  // Fetch course and its modules
  const courseList = await db.select().from(courses).where(eq(courses.category, p.category as any)).limit(1);
  const course = courseList[0] || { id: "dummy", title: `Category: ${p.category}`, description: "Amasomo" };
  
  // For the sake of this mock, if no actual course exists, supply empty modules array.
  let moduleList: any[] = [];
  if (courseList.length > 0) {
    moduleList = await db.select().from(modules).where(eq(modules.courseId, course.id)).orderBy(asc(modules.order));
  } else {
    // Generate default module wrapper for UI
    moduleList = [
      { id: "ikizamini-cyose", title: "Ikizamini Rusange (All Questions)", content: "Gerageza ibibazo byose muri iyi category", passingScore: 70 },
      { id: "ikizamini-gito", title: "Ikizamini Gito (Quick Test)", content: "Ibibazo 10 by'igerageza", passingScore: 70 }
    ];
  }

  return (
    <div className="space-y-6">
      <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />
      <div className="hud glass relative rounded-2xl p-6">
        <h1 className="text-glow text-2xl font-extrabold capitalize text-white md:text-3xl">{course.title}</h1>
        <p className="mt-2 text-sm text-cyan-100/65">{course.description}</p>
      </div>

      <div className="grid gap-4">
        {moduleList.map((mod, index) => (
          <div
            key={mod.id}
            className="glass is-interactive flex flex-col gap-3 rounded-2xl p-5 transition-all sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg glass-soft text-sm font-bold text-cyan-300">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-white">{mod.title}</h3>
                <p className="mt-0.5 text-xs text-cyan-100/60">{mod.content}</p>
              </div>
            </div>
            <Link href={`/courses/${p.category}/${mod.id}/quiz`} className="shrink-0">
              <Button className="glow-btn h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
                Kora Ikizamini ⏵
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
