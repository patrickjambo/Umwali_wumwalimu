import { db } from '../db';
import { questions, modules, courses } from '../db/schema';
import data from '../data/questions.json';

// Authoritative source: questions.json was audited against dreamz.txt
// (verified answers). Categories are taken from the data where present,
// otherwise derived from the question text/options.
const NUMERIC_PATTERN = /\d+\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)/i;
const IBYAPA_PATTERN = /icyapa|ibyapa|kimenyetso|ishusho|ibara|uruziga|mpandeshatu/i;

type Cat = 'text' | 'numeric' | 'ibyapa';

function categorize(q: any): Cat {
  if (q.category === 'text' || q.category === 'numeric' || q.category === 'ibyapa') {
    return q.category;
  }
  // A question that carries an image is a road-sign (ibyapa) question.
  if (q.image) return 'ibyapa';
  const hay = `${q.text || ''} ${(q.options || []).map((o: any) => o.text).join(' ')}`;
  if (IBYAPA_PATTERN.test(hay)) return 'ibyapa';
  if (NUMERIC_PATTERN.test(hay)) return 'numeric';
  return 'text';
}

const CATEGORY_META: Record<Cat, { slug: string; title: string; description: string }> = {
  text:    { slug: 'amategeko-rusange', title: 'Amategeko Rusange',    description: "Ibibazo by'amategeko rusange y'umuhanda" },
  numeric: { slug: 'imibare-n-ibipimo', title: "Imibare n'Ibipimo",    description: "Ibibazo birimo imibare n'ibipimo (km/h, metero...)" },
  ibyapa:  { slug: 'ibyapa',            title: "Ibyapa by'Umuhanda",   description: "Ibibazo by'ibyapa n'ibimenyetso by'umuhanda" },
};

async function seed() {
  console.log('Clearing existing questions, modules, courses...');
  await db.delete(questions);
  await db.delete(modules);
  await db.delete(courses);

  console.log(`Loaded ${data.length} audited questions.`);

  // Assign categories and guarantee globally-unique `number` values
  // (questions.json reuses 8, 52, 96 across sections; the column is UNIQUE).
  const seen = new Set<number>();
  const prepared = (data as any[]).map((q) => {
    let number: number = q.number;
    while (seen.has(number)) number += 1000;
    seen.add(number);
    return { ...q, _number: number, _category: categorize(q) };
  });

  const counts: Record<string, number> = {};
  for (const q of prepared) counts[q._category] = (counts[q._category] || 0) + 1;
  console.log('Category distribution:', counts);

  const categories: Cat[] = ['text', 'numeric', 'ibyapa'];
  let courseOrder = 1;
  let inserted = 0;

  for (const cat of categories) {
    const items = prepared.filter((q) => q._category === cat);
    if (items.length === 0) continue;

    const meta = CATEGORY_META[cat];
    const [course] = await db.insert(courses).values({
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      category: cat,
      order: courseOrder++,
      isPublished: true,
    }).returning({ id: courses.id });
    console.log(`Course "${meta.title}" (${cat}) -> ${items.length} questions`);

    // Chunk into modules of 20 questions each
    const chunkSize = 20;
    const numModules = Math.ceil(items.length / chunkSize);
    for (let i = 0; i < numModules; i++) {
      const chunk = items.slice(i * chunkSize, (i + 1) * chunkSize);
      const [mod] = await db.insert(modules).values({
        courseId: course.id,
        title: `Ibizamini ${i + 1}`,
        content: `Iki kizamini gifite ibibazo ${chunk.length}`,
        order: i + 1,
        passingScore: 70,
      }).returning({ id: modules.id });

      await db.insert(questions).values(chunk.map((q) => ({
        moduleId: mod.id,
        number: q._number,
        text: q.text,
        options: q.options,                 // raw array -> stored as jsonb
        correctKey: q.correctKey,
        category: q._category,
        explanation: q.explanation || `Igisubizo ni ${String(q.correctKey).toUpperCase()}`,
        signImageUrl: q.image || null,
      })));
      inserted += chunk.length;
    }
  }

  console.log(`Seeding completed. Inserted ${inserted} questions.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed questions:', err);
  process.exit(1);
});
