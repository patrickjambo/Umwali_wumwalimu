"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QuizQuestion, calculateScore, getCorrectKey } from "@/lib/quiz-engine";
import { useCompletion } from "@ai-sdk/react";

export default function QuizEngine({
  questions,
  moduleId,
  timeLimitSec,
  examMode,
}: {
  questions: QuizQuestion[];
  moduleId?: string;
  timeLimitSec?: number;
  examMode?: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [scoreData, setScoreData] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);
  const [aiExplanationIdx, setAiExplanationIdx] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(timeLimitSec ?? 0);

  const { completion, complete, isLoading } = useCompletion({ api: "/api/ai/explain" });

  const q = questions[currentIdx];

  // Refs so the countdown's auto-submit always reads the latest answers / runs once.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const current = answersRef.current;
    const correctKeys: Record<string, string> = {};
    questions.forEach((question) => {
      correctKeys[question.id] = getCorrectKey(question);
    });
    const result = calculateScore(current, questions, correctKeys);
    setScoreData(result);
    setShowResult(true);

    // Persist the attempt so the dashboard reflects it (fire-and-forget).
    if (moduleId || examMode) {
      const answersArr = questions.map((qq) => ({
        questionId: qq.id,
        selectedKey: current[qq.id] ?? null,
        correct: current[qq.id] === correctKeys[qq.id],
      }));
      fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: examMode ? undefined : moduleId,
          kind: examMode ? "exam" : "module",
          score: result.score,
          passed: result.passed,
          answers: answersArr,
        }),
      }).catch(() => {});
    }
  };

  // Countdown timer (only when a time limit is set).
  useEffect(() => {
    if (!timeLimitSec || showResult) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLimitSec, showResult]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (timeLimitSec && !showResult && remaining === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timeLimitSec, showResult]);

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleSelect = (key: string) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [q.id]: key }));
  };

  const handlePrev = () => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finish();
    }
  };

  const highlightNumbers = (text: string) => {
    const parts = text.split(/(\d+(?:\.\d+)?\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)?)/i);
    return parts.map((part, i) => {
      if (/(\d+(?:\.\d+)?\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)?)/i.test(part)) {
        return <strong key={i} className="font-bold text-cyan-300">{part}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (showResult && scoreData) {
    const correctKeys: Record<string, string> = {};
    questions.forEach((question) => {
      correctKeys[question.id] = getCorrectKey(question);
    });

    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 p-4 md:p-8 text-cyan-50">
        <h2 className="text-glow text-3xl font-extrabold text-white">{scoreData.passed ? "Watsinze! 🎉" : "Ongera Ugerageze"}</h2>
        <div className={`text-6xl font-black ${scoreData.passed ? "text-emerald-300" : "text-red-300"}`}>
          {scoreData.correct} / {scoreData.total}
        </div>
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${scoreData.passed ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-red-500 to-orange-400"}`}
            style={{ width: `${scoreData.score}%` }}
          />
        </div>
        <p className="text-sm text-cyan-100/70">Amanota: {scoreData.score}%</p>

        <div className="mt-8 flex w-full flex-col gap-4 text-left">
          <h3 className="border-b border-cyan-400/20 pb-2 text-xl font-bold text-white">Ibisubizo N&apos;Ubusobanuro (Review)</h3>
          {questions.map((quizQ, idx) => {
            const userAnswer = answers[quizQ.id];
            const correctAnswerKey = correctKeys[quizQ.id];
            const userCorrect = userAnswer === correctAnswerKey;
            const isExplaining = aiExplanationIdx === idx;

            return (
              <div
                key={quizQ.id}
                className={`glass space-y-2 rounded-2xl p-4 ${userCorrect ? "border-emerald-400/40" : "border-red-400/40"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold text-white">
                    {idx + 1}. {quizQ.category === "numeric" ? highlightNumbers(quizQ.text) : quizQ.text}
                  </p>
                  <span className="shrink-0 text-lg">{userCorrect ? "✅" : "❌"}</span>
                </div>

                {(quizQ.signImageUrl || quizQ.signSvg) && (
                  <div className="flex justify-start py-1">
                    {quizQ.signImageUrl ? (
                      <img src={quizQ.signImageUrl} alt="Road Sign" className="max-h-28 rounded-md border border-white/10 bg-white object-contain p-1" />
                    ) : (
                      <div className="rounded-md bg-white p-1" dangerouslySetInnerHTML={{ __html: quizQ.signSvg! }} />
                    )}
                  </div>
                )}

                <div className="mt-1 space-y-1 text-sm">
                  <p className={userCorrect ? "text-emerald-200" : "text-cyan-100/80"}>
                    Igisubizo Watoranyije:{" "}
                    {userAnswer ? (
                      <strong className="text-white">{userAnswer.toUpperCase()}. {quizQ.options.find((o) => o.key === userAnswer)?.text}</strong>
                    ) : (
                      <strong className="text-red-300">—</strong>
                    )}
                  </p>
                  {!userCorrect && (
                    <p className="text-emerald-300">
                      Igisubizo Cy&apos;Ukuri:{" "}
                      <strong>{correctAnswerKey.toUpperCase()}. {quizQ.options.find((o) => o.key === correctAnswerKey)?.text}</strong>
                    </p>
                  )}
                </div>

                {isExplaining && (
                  <div className="mt-3 rounded-lg border border-cyan-400/25 bg-cyan-500/10 p-3 text-sm text-cyan-50">
                    <strong className="mb-1 block text-cyan-200">Mwarimu (AI) 🤖</strong>
                    <p>{completion || (isLoading ? "Nteganya ubusobanuro..." : "")}</p>
                  </div>
                )}

                {!isExplaining && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAiExplanationIdx(idx);
                      complete(
                        JSON.stringify({
                          questionText: quizQ.text,
                          correctAnswer: quizQ.options.find((o) => o.key === correctAnswerKey)?.text,
                          category: quizQ.category,
                        })
                      );
                    }}
                    className="mt-1 text-xs text-cyan-300 hover:bg-white/5 hover:text-cyan-100"
                  >
                    💡 Soba ubusobanuro ku AI
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => window.location.reload()}
          className="glow-btn mt-8 h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-8 font-semibold text-white hover:from-cyan-400 hover:to-sky-400"
        >
          Komeza Uwige
        </Button>
      </div>
    );
  }

  if (!q) return <div className="text-cyan-100/80">Nta bibazo bihari.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-cyan-50">
      <div className="flex items-center justify-between text-sm font-medium text-cyan-100/65">
        <span>Ikibazo {currentIdx + 1} kuri {questions.length}</span>
        {timeLimitSec ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold tabular-nums ${
              remaining <= 60 ? "bg-red-500/20 text-red-200 animate-pulse-glow" : "bg-cyan-400/15 text-cyan-200"
            }`}
          >
            ⏱ {mmss(remaining)}
          </span>
        ) : (
          <span>Amanota yawe y&apos;agateganyo</span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all" style={{ width: `${(currentIdx / questions.length) * 100}%` }} />
      </div>

      <div className="hud glass rounded-2xl p-6 md:p-8">
        {(q.signImageUrl || q.signSvg) && (
          <div className="mb-6 flex w-full justify-center">
            {q.signImageUrl ? (
              <img src={q.signImageUrl} alt="Road Sign" className="max-h-64 rounded-lg border border-white/10 bg-white object-contain p-2" />
            ) : (
              <div className="rounded-lg bg-white p-2" dangerouslySetInnerHTML={{ __html: q.signSvg! }} />
            )}
          </div>
        )}

        <h2 className="text-xl font-semibold leading-relaxed text-white md:text-2xl">
          {q.category === "numeric" ? highlightNumbers(q.text) : q.text}
        </h2>

        <div className="mt-8 space-y-3">
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-cyan-400/70 bg-cyan-500/15 ring-2 ring-cyan-400/40"
                    : "border-cyan-400/15 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold ${
                      selected ? "border-cyan-300 bg-cyan-500 text-white" : "border-cyan-400/30 text-cyan-200"
                    }`}
                  >
                    {opt.key.toUpperCase()}
                  </div>
                  <span className="text-base text-cyan-50 md:text-lg">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          size="lg"
          variant="ghost"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="h-11 rounded-xl border border-cyan-400/25 bg-white/5 px-5 text-cyan-100/85 hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          ← Subira inyuma
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!answers[q.id]}
          className="glow-btn h-11 min-w-[180px] rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50"
        >
          {currentIdx === questions.length - 1 ? "Ohereza" : "Komeza →"}
        </Button>
      </div>
    </div>
  );
}
