import { db } from '../db';
import { questions, modules, courses } from '../db/schema';
import data from '../data/questions_grouped.json';

// Authoritative source: questions_grouped.json was parsed from dreamz.txt and
// contains the fuller question bank. Category labels in older JSON exports can
// be stale, so image/sign data and numeric content are checked before fallback.
const NUMERIC_PATTERN = /\d+\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)/i;
const IBYAPA_PATTERN = /icyapa|ibyapa|kimenyetso|ishusho|ibara|uruziga|mpandeshatu/i;

type Cat = 'text' | 'numeric' | 'ibyapa';
type SourceOption = { key: string; text: string; isCorrect?: boolean };
type SourceQuestion = {
  number: number;
  text: string;
  options: SourceOption[];
  correctKey: string;
  category?: Cat;
  explanation?: string;
  image?: string;
  signImageUrl?: string;
  signSvg?: string;
};

function hasSignMedia(q: SourceQuestion): boolean {
  return Boolean(q.image || q.signImageUrl || q.signSvg);
}

function categorize(q: SourceQuestion): Cat {
  if (hasSignMedia(q) || q.category === 'ibyapa') return 'ibyapa';

  const hay = `${q.text || ''} ${(q.options || []).map((o) => o.text).join(' ')}`;
  if (NUMERIC_PATTERN.test(hay) || q.category === 'numeric') return 'numeric';
  if (q.category === 'text') return 'text';
  if (IBYAPA_PATTERN.test(hay)) return 'ibyapa';
  return 'text';
}

function normalizeOptions(q: SourceQuestion): SourceOption[] {
  return q.options.map((option) => ({
    key: String(option.key).trim().toLowerCase(),
    text: String(option.text).trim(),
    isCorrect: option.isCorrect,
  }));
}

// The PDF parse left some questions corrupted (merged/blank options, sign
// questions whose image was lost). We never seed those, and we strip images
// that were wrongly glued onto plain text questions. Raw JSON stays intact.
const SIGN_Q = (t = ''): boolean =>
  /\b(iki|iyi|ibi|iyo|iyihe|aya|icyapa)\b[^.]{0,40}\b(cyapa|byapa|kimenyetso|bimenyetso|shusho|ishusho)\b/i.test(t) ||
  /\b(cyapa|byapa|kimenyetso)\b[^.]{0,35}\b(gisobanura|cyivuga|kivuga|kivuze|kigaragaza|gikurikira|bikurikira|bikurira|gikoresha|kibuza|cyerekana)\b/i.test(t) ||
  /\bbyapa\b[^.]{0,25}\b(bikurikira|bikurira)\b/i.test(t);

const optCorrupt = (o: SourceOption): boolean => {
  const t = (o.text || '').trim();
  return t.length === 0 || /^[a-d][).\s]*$/i.test(t);
};

const needsImage = (q: SourceQuestion): boolean => SIGN_Q(q.text) || q.category === 'ibyapa';

function quarantineReason(q: SourceQuestion): string | null {
  if (!Array.isArray(q.options) || q.options.length !== 4) return `options=${q.options ? q.options.length : 0}`;
  if (q.options.some(optCorrupt)) return 'corrupt-option';
  if (SIGN_Q(q.text) && !hasSignMedia(q)) return 'sign-question-without-image';
  return null;
}

function normalizeQuestion(q: SourceQuestion): SourceQuestion {
  const options = normalizeOptions(q);
  const correctKey = String(q.correctKey || '').trim().toLowerCase();

  if (!Number.isInteger(q.number)) {
    throw new Error(`Question has invalid number: ${JSON.stringify(q)}`);
  }
  if (!q.text || !String(q.text).trim()) {
    throw new Error(`Question ${q.number} is missing text`);
  }
  if (options.length < 2) {
    throw new Error(`Question ${q.number} must have at least two options`);
  }
  if (!options.some((option) => option.key === correctKey)) {
    throw new Error(`Question ${q.number} correctKey "${correctKey}" is not present in its options`);
  }

  return {
    ...q,
    text: String(q.text).trim(),
    options,
    correctKey,
  };
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

  console.log(`Loaded ${data.length} parsed questions.`);

  // Quarantine broken questions, strip mis-attached images, assign categories,
  // and guarantee globally-unique `number` values (`number` is UNIQUE in the
  // database, while dreamz.txt repeats a few labels).
  const dropped: { number: number; reason: string }[] = [];
  let strippedImages = 0;
  const seen = new Set<number>();
  const prepared: (SourceQuestion & { _number: number; _category: Cat })[] = [];
  for (const rawQuestion of data as SourceQuestion[]) {
    const reason = quarantineReason(rawQuestion);
    if (reason) { dropped.push({ number: rawQuestion.number, reason }); continue; }
    // Drop an image that was mis-attached to a plain text question.
    let src = rawQuestion;
    if (hasSignMedia(rawQuestion) && !needsImage(rawQuestion)) {
      src = { ...rawQuestion, image: undefined, signImageUrl: undefined, signSvg: undefined };
      strippedImages++;
    }
    const q = normalizeQuestion(src);
    let number: number = q.number;
    while (seen.has(number)) number += 1000;
    seen.add(number);
    prepared.push({ ...q, _number: number, _category: categorize(q) });
  }

  console.log(`Stripped mis-attached images from ${strippedImages} text questions.`);
  console.log(`Quarantined ${dropped.length} broken questions:`, dropped.map((d) => `#${d.number}(${d.reason})`).join(', '));

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
        options: q.options,
        correctKey: q.correctKey,
        category: q._category,
        explanation: q.explanation || `Igisubizo ni ${String(q.correctKey).toUpperCase()}`,
        signImageUrl: q.signImageUrl || q.image || null,
        signSvg: q.signSvg || null,
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
