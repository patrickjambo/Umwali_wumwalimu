"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion, calculateScore } from "@/lib/quiz-engine";
import { useCompletion } from "@ai-sdk/react";

export default function QuizEngine({ questions }: { questions: QuizQuestion[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [scoreData, setScoreData] = useState<{score: number, passed: boolean} | null>(null);
  const [aiExplanationIdx, setAiExplanationIdx] = useState<number | null>(null);

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/ai/explain'
  });
  
  const q = questions[currentIdx];

  const handleSelect = (key: string) => {
    setAnswers({ ...answers, [q.id]: key });
  };  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Calculate results
      const correctKeys: Record<string, string> = {};
      // Mock correct keys for the sake of frontend UI
      questions.forEach(q => correctKeys[q.id] = q.options[0]?.key || "a"); 
      const result = calculateScore(answers, questions, correctKeys);
      setScoreData(result);
      setShowResult(true);
    }
  };

  const highlightNumbers = (text: string) => {
      // Very basic regex highlighter
      const parts = text.split(/(\d+(?:\.\d+)?\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)?)/i);
      return parts.map((part, i) => {
          if (/(\d+(?:\.\d+)?\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)?)/i.test(part)) {
              return <strong key={i} className="text-blue-600 font-bold">{part}</strong>;
          }
          return <span key={i}>{part}</span>;
      });
  }

  if (showResult && scoreData) {
    const correctKeys: Record<string, string> = {};
    questions.forEach(q => correctKeys[q.id] = q.correctKey || q.options[0]?.key || "a"); 

    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-3xl font-bold">{scoreData.passed ? "Watsinze! 🎉" : "Ongera Ugerageze"}</h2>
        <div className="text-6xl font-black text-brand-600">{scoreData.correct} / {scoreData.total}</div>
        <Progress value={scoreData.score} className={`w-full max-w-md h-4 ${scoreData.passed ? 'bg-rwandan-green' : 'bg-red-500'}`} />
        
        <div className="w-full max-w-2xl mt-8 flex flex-col gap-4 text-left">
          <h3 className="text-xl font-bold border-b pb-2">Ibisubizo N'Ubusobanuro (Review)</h3>
          {questions.map((quizQ, idx) => {
            const userAnswer = answers[quizQ.id];
            const correctAnswerKey = correctKeys[quizQ.id];
            const userCorrect = userAnswer === correctAnswerKey;
            const isExplaining = aiExplanationIdx === idx;
            
            return (
              <Card key={quizQ.id} className={userCorrect ? "border-green-200" : "border-red-200"}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-semibold text-gray-800">{idx + 1}. {quizQ.category === 'numeric' ? highlightNumbers(quizQ.text) : quizQ.text}</p>
                    {userCorrect ? <span className="text-green-600 font-bold shrink-0">✅</span> : <span className="text-red-500 font-bold shrink-0">❌</span>}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Igisubizo Watoranyije: <strong>{userAnswer?.toUpperCase() || '-'}</strong></p>
                    {!userCorrect && <p>Igisubizo Cy'Ukuri: <strong>{correctAnswerKey.toUpperCase()}</strong></p>}
                  </div>
                  
                  {isExplaining && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-sm transition-all duration-300">
                      <strong className="block mb-1">Mwarimu (AI) 🤖</strong>
                      <p>{completion || (isLoading ? "Nteganya ubusobanuro..." : "")}</p>
                    </div>
                  )}
                  
                  {!isExplaining && (
                    <Button 
                       variant="ghost" 
                       size="sm"
                       onClick={() => {
                         setAiExplanationIdx(idx);
                         complete(JSON.stringify({ 
                           questionText: quizQ.text, 
                           correctAnswer: quizQ.options.find(o => o.key === correctAnswerKey)?.text,
                           category: quizQ.category 
                         }));
                       }}
                       className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                       💡 Soba ubusobanuro ku AI
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Button onClick={() => window.location.reload()} className="mt-8 px-8 border bg-transparent hover:bg-gray-100 text-rwandan-blue">
          Komeza Uwige
        </Button>
      </div>
    );
  }

  if (!q) return <div>Nta bibazo bihari.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center text-sm font-medium text-gray-500">
        <span>Ikibazo {currentIdx + 1} kuri {questions.length}</span>
        <span>Amanota yawe y'agateganyo</span>
      </div>
      <Progress value={(currentIdx / questions.length) * 100} className="h-2" />

      <Card className="shadow-lg border-2">
        <CardContent className="p-6 md:p-8 space-y-6">
          {(q.signImageUrl || q.signSvg) && (
            <div className="w-full flex justify-center mb-6">
              {q.signImageUrl ? (
                 <img src={q.signImageUrl} alt="Road Sign" className="max-h-64 object-contain rounded-md shadow-sm border border-gray-100" />
              ) : (
                 <div dangerouslySetInnerHTML={{ __html: q.signSvg! }} />
              )}
            </div>
          )}

          <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
            {q.category === 'numeric' ? highlightNumbers(q.text) : q.text}
          </h2>

          <div className="space-y-3 mt-8">
            {q.options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  answers[q.id] === opt.key 
                    ? 'border-rwandan-blue bg-blue-50 shadow-md ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                    answers[q.id] === opt.key ? 'border-rwandan-blue bg-rwandan-blue text-white' : 'border-gray-300 text-gray-500'
                  }`}>
                    {opt.key.toUpperCase()}
                  </div>
                  <span className="text-base md:text-lg">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleNext} 
          disabled={!answers[q.id]}
          className="bg-rwandan-blue hover:bg-rwandan-blue/90 text-white min-w-[200px]"
        >
          {currentIdx === questions.length - 1 ? "Ohereza" : "Komeza"}
        </Button>
      </div>
    </div>
  );
}
