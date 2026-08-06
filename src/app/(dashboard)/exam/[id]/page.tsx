import { db } from "@/db";
import { questions, generatedExams } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import QuizEngine from "@/components/quiz/QuizEngine";
import { BackButton } from "@/components/layout/BackButton";

export const dynamic = "force-dynamic";

export default async function GeneratedExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = (await db.select().from(generatedExams).where(eq(generatedExams.id, id)).limit(1))[0];
  if (!exam) notFound();

  const ids = Array.isArray(exam.questionIds) ? (exam.questionIds as string[]) : [];
  const rows = ids.length ? await db.select().from(questions).where(inArray(questions.id, ids)) : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const qList = ids.map((i) => byId.get(i)).filter((q): q is (typeof rows)[number] => Boolean(q));

  return (
    <div className="py-8">
      <div className="mb-4">
        <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-glow text-2xl font-bold text-white">{exam.title}</h1>
        <p className="text-cyan-100/65">Ibibazo {qList.length} • Iminota 20</p>
      </div>
      <QuizEngine
        questions={qList as unknown as Parameters<typeof QuizEngine>[0]["questions"]}
        timeLimitSec={20 * 60}
        examMode
      />
    </div>
  );
}
