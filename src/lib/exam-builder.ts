import { db } from "@/db";
import { questions, appSettings } from "@/db/schema";
import { eq, and, asc, isNotNull } from "drizzle-orm";

type Q = typeof questions.$inferSelect;

// Official police-exam composition: 20 questions = 5 from each group, in order.
// The two picture groups (sign, roadpic) only pull questions that actually have
// an image. Each group keeps a rotating cursor so successive exams cycle
// through the whole group in order ("looping") and never repeat within one exam.
const GROUPS = [
  { key: "sign", n: 5, imageOnly: true }, // ibyapa: symbols/direction/prohibitory/warning
  { key: "number", n: 5, imageOnly: false }, // ibipimo / numeric
  { key: "analysis", n: 5, imageOnly: false }, // reasoning / think-twice
  { key: "roadpic", n: 5, imageOnly: true }, // road-scene pictures
] as const;

async function getCursor(key: string): Promise<number> {
  const r = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  const v = parseInt(r[0]?.value ?? "0", 10);
  return Number.isFinite(v) && v >= 0 ? v : 0;
}
async function setCursor(key: string, value: number) {
  const val = String(value);
  await db.insert(appSettings).values({ key, value: val }).onConflictDoUpdate({ target: appSettings.key, set: { value: val } });
}

/**
 * Build a 20-question exam grouped as sign → number → analysis → roadpic,
 * rotating through each group so it loops in order across attempts, with no
 * repeats inside a single exam.
 */
export async function buildRotatingExam(): Promise<Q[]> {
  const out: Q[] = [];
  for (const g of GROUPS) {
    const pool = await db
      .select()
      .from(questions)
      .where(and(eq(questions.examGroup, g.key), g.imageOnly ? isNotNull(questions.signImageUrl) : undefined))
      .orderBy(asc(questions.number));
    if (pool.length === 0) continue;

    const cursorKey = `exam_cur_${g.key}`;
    const start = (await getCursor(cursorKey)) % pool.length;
    const take = Math.min(g.n, pool.length);
    for (let i = 0; i < take; i++) out.push(pool[(start + i) % pool.length]);
    await setCursor(cursorKey, (start + take) % pool.length);
  }
  return out;
}
