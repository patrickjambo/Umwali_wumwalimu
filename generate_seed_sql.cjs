/*
 * Generates a transactional SQL seed from questions_grouped.json that mirrors
 * src/scripts/seed-questions.ts EXACTLY (categorisation, number dedup, one
 * course per category, 20-question modules). Avoids the neon-http driver that
 * times out from this sandbox; pipe the output to psql instead.
 */
const crypto = require('crypto');
const data = require('./src/data/questions_grouped.json');

const NUMERIC_PATTERN = /\d+\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)/i;
const IBYAPA_PATTERN = /icyapa|ibyapa|kimenyetso|ishusho|ibara|uruziga|mpandeshatu/i;

const hasSignMedia = (q) => Boolean(q.image || q.signImageUrl || q.signSvg);

function categorize(q) {
  if (hasSignMedia(q) || q.category === 'ibyapa') return 'ibyapa';
  const hay = `${q.text || ''} ${(q.options || []).map((o) => o.text).join(' ')}`;
  if (NUMERIC_PATTERN.test(hay) || q.category === 'numeric') return 'numeric';
  if (q.category === 'text') return 'text';
  if (IBYAPA_PATTERN.test(hay)) return 'ibyapa';
  return 'text';
}

function normalizeQuestion(q) {
  const options = q.options.map((o) => ({
    key: String(o.key).trim().toLowerCase(),
    text: String(o.text).trim(),
    ...(o.isCorrect !== undefined ? { isCorrect: o.isCorrect } : {}),
  }));
  const correctKey = String(q.correctKey || '').trim().toLowerCase();
  if (!Number.isInteger(q.number)) throw new Error(`bad number ${JSON.stringify(q)}`);
  if (!q.text || !String(q.text).trim()) throw new Error(`Q${q.number} missing text`);
  if (options.length < 2) throw new Error(`Q${q.number} <2 options`);
  if (!options.some((o) => o.key === correctKey)) throw new Error(`Q${q.number} correctKey ${correctKey} not in options`);
  return { ...q, text: String(q.text).trim(), options, correctKey };
}

const CATEGORY_META = {
  text:    { slug: 'amategeko-rusange', title: 'Amategeko Rusange',  description: "Ibibazo by'amategeko rusange y'umuhanda" },
  numeric: { slug: 'imibare-n-ibipimo', title: "Imibare n'Ibipimo",  description: "Ibibazo birimo imibare n'ibipimo (km/h, metero...)" },
  ibyapa:  { slug: 'ibyapa',            title: "Ibyapa by'Umuhanda", description: "Ibibazo by'ibyapa n'ibimenyetso by'umuhanda" },
};

// --- data quarantine (mirror seed-questions.ts) ----------------------------
// Sign images were re-extracted from dreamz.pdf and re-mapped per question, so
// the embedded `image` data is authoritative and is never stripped. We only
// drop questions whose OPTIONS are unusable (image-only option questions that
// can't render as text, or parser corruption). Raw JSON is left intact.
const optCorrupt = (o) => { const t = (o.text || '').trim(); return t.length === 0 || /^[a-d][).\s]*$/i.test(t); };

function quarantineReason(q) {
  if (!Array.isArray(q.options) || q.options.length !== 4) return `options=${q.options ? q.options.length : 0}`;
  if (q.options.some(optCorrupt)) return 'corrupt-option';
  return null;
}

// --- SQL helpers -----------------------------------------------------------
const S = (v) => (v === null || v === undefined) ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const J = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;

// --- mirror seed() ---------------------------------------------------------
const dropped = [];
const seen = new Set();
const prepared = [];
for (const raw of data) {
  const reason = quarantineReason(raw);
  if (reason) { dropped.push({ number: raw.number, reason }); continue; }
  const q = normalizeQuestion(raw);
  let number = q.number;
  while (seen.has(number)) number += 1000;
  seen.add(number);
  prepared.push({ ...q, _number: number, _category: categorize(q) });
}

const counts = {};
for (const q of prepared) counts[q._category] = (counts[q._category] || 0) + 1;

const lines = [];
lines.push('BEGIN;');
lines.push('DELETE FROM questions;');
lines.push('DELETE FROM modules;');
lines.push('DELETE FROM courses;');

let courseOrder = 1;
let inserted = 0;
for (const cat of ['text', 'numeric', 'ibyapa']) {
  const items = prepared.filter((q) => q._category === cat);
  if (items.length === 0) continue;
  const meta = CATEGORY_META[cat];
  const courseId = crypto.randomUUID();
  lines.push(
    `INSERT INTO courses (id, slug, title, description, category, "order", is_published) VALUES ` +
    `('${courseId}', ${S(meta.slug)}, ${S(meta.title)}, ${S(meta.description)}, '${cat}', ${courseOrder++}, true);`
  );

  const chunkSize = 20;
  const numModules = Math.ceil(items.length / chunkSize);
  for (let i = 0; i < numModules; i++) {
    const chunk = items.slice(i * chunkSize, (i + 1) * chunkSize);
    const moduleId = crypto.randomUUID();
    lines.push(
      `INSERT INTO modules (id, course_id, title, content, "order", passing_score) VALUES ` +
      `('${moduleId}', '${courseId}', ${S('Ibizamini ' + (i + 1))}, ${S('Iki kizamini gifite ibibazo ' + chunk.length)}, ${i + 1}, 70);`
    );
    for (const q of chunk) {
      const explanation = q.explanation || `Igisubizo ni ${String(q.correctKey).toUpperCase()}`;
      const signImageUrl = q.signImageUrl || q.image || null;
      lines.push(
        `INSERT INTO questions (number, category, text, options, correct_key, explanation, sign_image_url, sign_svg, module_id) VALUES ` +
        `(${q._number}, '${q._category}', ${S(q.text)}, ${J(q.options)}, ${S(q.correctKey)}, ${S(explanation)}, ${S(signImageUrl)}, ${S(q.signSvg || null)}, '${moduleId}');`
      );
      inserted++;
    }
  }
}
lines.push('COMMIT;');

process.stderr.write(`Category distribution: ${JSON.stringify(counts)}\n`);
process.stderr.write(`Questions with sign image: ${prepared.filter((q) => q.image || q.signImageUrl || q.signSvg).length}\n`);
process.stderr.write(`Quarantined ${dropped.length} broken questions: ${dropped.map((d) => `#${d.number}(${d.reason})`).join(', ')}\n`);
process.stderr.write(`Prepared ${prepared.length} questions, will insert ${inserted}.\n`);
process.stdout.write(lines.join('\n') + '\n');
