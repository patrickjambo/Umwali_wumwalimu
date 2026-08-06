"use server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { generatedExams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getQuestionsIndex } from "@/lib/catalog";
import { pickQuestionsForSeed, fetchYouTubeHint } from "@/lib/exam-generator";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const s = await auth();
  if ((s?.user as { role?: string } | undefined)?.role !== "admin") throw new Error("forbidden");
}

// Generate an exam from OUR bank using a topic/video seed.
export async function generateExamAction(formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  let title = String(formData.get("title") ?? "").trim();
  const countRaw = parseInt(String(formData.get("count") ?? "20"), 10);
  const count = Number.isFinite(countRaw) ? Math.min(40, Math.max(5, countRaw)) : 20;

  let seed = text;
  if (url) {
    const hint = await fetchYouTubeHint(url);
    if (hint) {
      seed = `${hint} ${seed}`.trim();
      if (!title) title = hint;
    }
  }

  const index = await getQuestionsIndex();
  const ids = pickQuestionsForSeed(index, seed, count);
  if (!title) title = `Ikizamini ${new Date().toLocaleDateString("en-GB")}`;

  await db.insert(generatedExams).values({ title, sourceUrl: url || null, questionIds: ids });
  revalidatePath("/admin/exams");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}

export async function deleteExamAction(id: string) {
  await requireAdmin();
  await db.delete(generatedExams).where(eq(generatedExams.id, id));
  revalidatePath("/admin/exams");
  revalidatePath("/dashboard");
}
