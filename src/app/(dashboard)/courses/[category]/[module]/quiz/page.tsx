import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import QuizEngine from "@/components/quiz/QuizEngine";
import { notFound } from "next/navigation";

export default async function QuizPage({ params, searchParams }: { params: Promise<{ category: string, module: string }>, searchParams?: Promise<{ type?: string }> }) {
  const p = await params;
  const sp = searchParams ? await searchParams : { type: 'quick' };
  const takeFull = sp.type === 'full';
  
  // Fetch questions for the category (all of them if 'full', limit to 10 if 'quick')
  let qList = await db.select().from(questions)
     .where(eq(questions.category, p.category as any))
     .orderBy(sql`RANDOM()`)
     .limit(takeFull ? 500 : 10);
  
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
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Ikizamini: {p.category.toUpperCase()}</h1>
        <p className="text-gray-500">Ibibazo {qList.length} • Amanota fatizo 70%</p>
      </div>
      <QuizEngine questions={qList as any} />
    </div>
  );
}
