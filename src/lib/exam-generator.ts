// Build an exam from OUR question bank by matching a topic/video "seed" text.
// We never store or reproduce external content — only the seed's keywords are
// used to rank our own questions; students only ever see our bank.

type IndexQ = { id: string; text: string; options: unknown; category: string };

// Common Kinyarwanda/English filler words that carry no topic signal.
const STOP = new Set([
  "na", "mu", "ku", "ni", "cyangwa", "ibi", "iyi", "iki", "uyu", "aha", "kandi",
  "ariko", "bya", "byo", "cya", "cyo", "rwa", "rwo", "ya", "yo", "wa", "wo",
  "the", "of", "in", "to", "and", "or", "is", "for", "a", "an", "iyo", "aya",
  "muri", "kuri", "ubu", "buri", "nka", "ko", "we", "bo", "yose", "gusa",
]);

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(/[^a-z0-9%/ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (s: string) => norm(s).split(" ").filter((t) => t.length > 2 && !STOP.has(t));

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/**
 * Rank the bank by keyword overlap with the seed and return `count` question ids.
 * Falls back to random fill when the seed matches too few questions.
 */
export function pickQuestionsForSeed(index: IndexQ[], seedText: string, count = 20): string[] {
  const seed = new Set(tokenize(seedText));
  if (seed.size === 0) return shuffle(index).slice(0, count).map((q) => q.id);

  const scored = index.map((q) => {
    const opts = Array.isArray(q.options) ? (q.options as { text?: string }[]).map((o) => o?.text ?? "").join(" ") : "";
    const qTokens = new Set(tokenize(`${q.text} ${opts}`));
    let score = 0;
    for (const t of qTokens) if (seed.has(t)) score++;
    return { id: q.id, score };
  });

  const matched = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const chosen = matched.slice(0, count).map((x) => x.id);

  if (chosen.length < count) {
    const have = new Set(chosen);
    for (const id of shuffle(index.filter((q) => !have.has(q.id)).map((q) => q.id))) {
      if (chosen.length >= count) break;
      chosen.push(id);
    }
  }
  return chosen;
}

/** Read a YouTube video's title + author via oEmbed (no API key). Best-effort. */
export async function fetchYouTubeHint(url: string): Promise<string | null> {
  if (!/youtu\.?be/.test(url)) return null;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { title?: string; author_name?: string };
    return [j.title, j.author_name].filter(Boolean).join(" ") || null;
  } catch {
    return null;
  }
}
