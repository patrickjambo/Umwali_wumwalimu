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

const unescapeJson = (s: string) => {
  try {
    return JSON.parse(`"${s}"`);
  } catch {
    return s;
  }
};

/** Read a video's title + description from its watch page (richer seed than the
 *  title alone; teachers usually list the day's topics in the description). */
export async function fetchYouTubeVideoInfo(url: string): Promise<{ title: string; description: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0", "accept-language": "rw,en;q=0.9" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const title =
      unescapeJson((html.match(/"title":\s*"((?:[^"\\]|\\.)*)"/) || [])[1] || "").trim() ||
      decodeXml((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "").replace(/ - YouTube$/, "").trim();
    const description = unescapeJson((html.match(/"shortDescription":\s*"((?:[^"\\]|\\.)*)"/) || [])[1] || "").trim();
    if (!title && !description) return null;
    return { title, description };
  } catch {
    return null;
  }
}

/** Best-effort seed text (title + description) for a single video URL. */
export async function fetchYouTubeHint(url: string): Promise<string | null> {
  if (!/youtu\.?be/.test(url)) return null;
  const info = await fetchYouTubeVideoInfo(url);
  if (info && (info.title || info.description)) return `${info.title} ${info.description}`.trim();
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

const decodeXml = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3?9;|&apos;/g, "'")
    .trim();

/** Resolve a channel id (UC…) from a channel id, /channel/ URL, or @handle URL. */
export async function resolveChannelId(source: string): Promise<string | null> {
  const s = source.trim();
  if (/^UC[\w-]{20,}$/.test(s)) return s;
  const direct = s.match(/channel\/(UC[\w-]{20,})/);
  if (direct) return direct[1];
  try {
    const url = s.startsWith("http") ? s : `https://www.youtube.com/${s.replace(/^\//, "")}`;
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/"channelId":"(UC[\w-]{20,})"/) || html.match(/channel\/(UC[\w-]{20,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Newest video (id, title, url, description) of a channel via its RSS feed. */
export async function fetchLatestChannelVideo(
  channelId: string,
): Promise<{ videoId: string; title: string; url: string; description: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { cache: "no-store" });
    if (!res.ok) return null;
    const xml = await res.text();
    const entry = xml.split("<entry>")[1];
    if (!entry) return null;
    const videoId = (entry.match(/<yt:videoId>([\w-]+)<\/yt:videoId>/) || [])[1];
    if (!videoId) return null;
    const title = decodeXml((entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const description = decodeXml((entry.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || "");
    return { videoId, title, url: `https://www.youtube.com/watch?v=${videoId}`, description };
  } catch {
    return null;
  }
}
