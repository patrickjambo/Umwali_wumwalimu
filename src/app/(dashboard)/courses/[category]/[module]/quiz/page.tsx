import { questions } from "@/db/schema";
import QuizEngine from "@/components/quiz/QuizEngine";
import { BackButton } from "@/components/layout/BackButton";
import { getModuleQuestions } from "@/lib/catalog";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function QuizPage({ params }: { params: Promise<{ category: string, module: string }> }) {
  const p = await params;

  // Cached per-module questions (moduleId is unique to a category, no DB hit on revisit).
  let qList: (typeof questions.$inferSelect)[] = [];
  if (UUID_PATTERN.test(p.module)) {
    qList = await getModuleQuestions(p.module);
  }
  
  if (qList.length === 0) {
    // Generate dummy questions
    qList = Array.from({ length: 5 }).map((_, i) => ({
      id: `q-${i}`,
      number: i + 1,
      category: p.category as any,
      text: p.category === "numeric" ? `Umvuduko ntarengwa w'imodoka y'abagenzi ni 60 km/h? Ikibazo cya ${i+1}` : p.category === "ibyapa" ? `Iki cyapa kivuga iki? Ikibazo cya ${i+1}` : `Amategeko y'umuhanda arinda abantu. Ikibazo cya ${i+1}`,
      textEn: null,
      options: [
        { key: "a", text: "Nibyo rwose" },
        { key: "b", text: "Oya si byo" },
        { key: "c", text: "Simbizi" },
        { key: "d", text: "Ndumva bishoboka" }
      ],
      correctKey: "a",
      explanation: "Igisubizo nyacyo ni A kubera...",
      signImageUrl: null,
      signSvg: p.category === "ibyapa" ? `<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="red" stroke-width="10" fill="white" /><text x="50" y="55" font-size="30" text-anchor="middle" fill="black">50</text></svg>` : null,
      moduleId: p.module,
      createdAt: new Date(),
    }));
  }

  return (
    <div className="py-8">
      <div className="mb-4">
        <BackButton label="Subira ku Amasomo" fallback={`/courses/${p.category}`} />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-glow text-2xl font-bold text-white">Ikizamini: {p.category.toUpperCase()}</h1>
        <p className="text-cyan-100/65">Ibibazo {qList.length} • Amanota fatizo 70%</p>
      </div>
      <QuizEngine questions={qList as any} moduleId={UUID_PATTERN.test(p.module) ? p.module : undefined} />
    </div>
  );
}
