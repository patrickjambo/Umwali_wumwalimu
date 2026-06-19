import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import QuizEngine from "@/components/quiz/QuizEngine";
import { BackButton } from "@/components/layout/BackButton";

// Always render fresh so the random question set differs each visit.
export const dynamic = "force-dynamic";

type Q = typeof questions.$inferSelect;
const pickRandom = (cat: "text" | "numeric" | "ibyapa", n: number) =>
  db.select().from(questions).where(eq(questions.category, cat)).orderBy(sql`RANDOM()`).limit(n);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function ExamPage() {
  // 20 questions mixed across A (text), B (numeric) and C (ibyapa).
  const [a, b, c] = await Promise.all([pickRandom("text", 7), pickRandom("numeric", 6), pickRandom("ibyapa", 7)]);
  const qList: Q[] = shuffle([...a, ...b, ...c]).slice(0, 20);

  return (
    <div className="py-8">
      <div className="mb-4">
        <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-glow text-2xl font-bold text-white">Ikizamini Rusange cy&apos;Iminota 20</h1>
        <p className="text-cyan-100/65">
          Ibibazo {qList.length} bivanze muri A, B na C • Iminota 20 • bitoranywa ku buryo butunguranye
        </p>
      </div>
      <QuizEngine questions={qList as unknown as Parameters<typeof QuizEngine>[0]["questions"]} timeLimitSec={20 * 60} />
    </div>
  );
}
