"use server";
import { db } from "@/db";
import { generatedExams, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getQuestionsIndex } from "@/lib/catalog";
import { pickQuestionsForSeed, matchQuestionsByLines, fetchYouTubeHint } from "@/lib/exam-generator";
import { runDailyExamFromSettings } from "@/lib/daily-exam";
import { requireAdmin } from "@/lib/admin-guard";
import { revalidatePath } from "next/cache";

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
  // If a question list is pasted (one per line), match each line to the bank;
  // otherwise fall back to topic/keyword matching over the whole seed.
  const questionsText = String(formData.get("questions") ?? "").trim();
  let ids: string[];
  if (questionsText) {
    ids = matchQuestionsByLines(index, questionsText, count);
    if (ids.length < count) {
      const have = new Set(ids);
      for (const extra of pickQuestionsForSeed(index, `${questionsText} ${seed}`, count)) {
        if (ids.length >= count) break;
        if (!have.has(extra)) {
          ids.push(extra);
          have.add(extra);
        }
      }
    }
  } else {
    ids = pickQuestionsForSeed(index, seed, count);
  }
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

// Save the YouTube source (channel URL/@handle/id or a video URL) the daily
// job pulls from.
export async function setYoutubeSourceAction(formData: FormData) {
  await requireAdmin();
  const source = String(formData.get("source") ?? "").trim();
  await db
    .insert(appSettings)
    .values({ key: "youtube_source", value: source })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: source } });
  revalidatePath("/admin/exams");
}

// Trigger the daily generation immediately (same logic the cron runs), forcing
// a fresh exam even if the latest video was already used.
export async function runDailyNowAction() {
  await requireAdmin();
  await runDailyExamFromSettings(true);
  revalidatePath("/admin/exams");
  revalidatePath("/dashboard");
}
