import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { courses, modules, questions } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

// The course catalog (courses, modules, and a module's questions) is the same
// for every user and changes only on re-seed, so we cache it across requests.
// This removes the Neon round-trips from dashboard / courses / quiz navigation.
// Revalidates every 10 min; tag "catalog" allows manual invalidation.
const REVALIDATE = 600;

export const getCourses = unstable_cache(
  async () => db.select().from(courses),
  ["catalog:courses"],
  { revalidate: REVALIDATE, tags: ["catalog"] }
);

export const getModules = unstable_cache(
  async () => db.select().from(modules).orderBy(asc(modules.order)),
  ["catalog:modules"],
  { revalidate: REVALIDATE, tags: ["catalog"] }
);

export const getModuleQuestions = unstable_cache(
  async (moduleId: string) =>
    db.select().from(questions).where(eq(questions.moduleId, moduleId)).orderBy(asc(questions.number)),
  ["catalog:module-questions"],
  { revalidate: REVALIDATE, tags: ["catalog"] }
);
