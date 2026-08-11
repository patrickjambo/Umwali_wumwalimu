import QuizEngine from "@/components/quiz/QuizEngine";
import { BackButton } from "@/components/layout/BackButton";
import { buildRotatingExam } from "@/lib/exam-builder";
import { auth } from "@/lib/auth";

// Always render fresh so the rotating question set differs each visit.
export const dynamic = "force-dynamic";

export default async function ExamPage() {
  // Police-exam layout: 5 ibyapa + 5 imibare + 5 isesengura + 5 amafoto,
  // pulling only questions this user hasn't seen so attempts don't repeat.
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const qList = await buildRotatingExam(userId);

  return (
    <div className="py-8">
      <div className="mb-4">
        <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-glow text-2xl font-bold text-white">Ikizamini Rusange cy&apos;Iminota 20</h1>
        <p className="text-cyan-100/65">
          Ibibazo {qList.length}: ibyapa 5 • imibare 5 • isesengura 5 • amafoto y&apos;umuhanda 5 • Iminota 20
        </p>
      </div>
      <QuizEngine
        questions={qList as unknown as Parameters<typeof QuizEngine>[0]["questions"]}
        timeLimitSec={20 * 60}
        examMode
      />
    </div>
  );
}
