export interface QuizQuestion {
  id: string;
  number: number;
  text: string;
  options: { key: string; text: string }[];
  signSvg?: string;
  signImageUrl?: string;
  correctKey?: string;
  category: 'text' | 'numeric' | 'ibyapa';
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string>; // questionId → selectedKey
  startTime: number;
}

export function calculateScore(
  answers: Record<string, string>,
  questions: QuizQuestion[],
  correctKeys: Record<string, string>
): { score: number; passed: boolean; correct: number; total: number } {
  const correct = Object.entries(answers).filter(
    ([qId, key]) => correctKeys[qId] === key
  ).length;
  
  const total = questions.length;
  const score = Math.round((correct / total) * 100);
  
  return { score, passed: score >= 70, correct, total };
}
