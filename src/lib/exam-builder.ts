import { db } from "@/db";
import { questions, examSeen } from "@/db/schema";
import { eq, and, sql, isNotNull, notInArray, inArray } from "drizzle-orm";

type Q = typeof questions.$inferSelect;

// Official police-exam composition: 20 questions = 5 from each group, in order.
// The two picture groups (sign, roadpic) only pull questions that have an image.
const GROUPS = [
  { key: "sign", n: 5, imageOnly: true }, // ibyapa: symbols/direction/prohibitory/warning
  { key: "number", n: 5, imageOnly: false }, // ibipimo / numeric
  { key: "analysis", n: 5, imageOnly: false }, // reasoning / think-twice
  { key: "roadpic", n: 5, imageOnly: true }, // road-scene pictures
] as const;

const groupWhere = (key: string, imageOnly: boolean) =>
  and(eq(questions.examGroup, key), imageOnly ? isNotNull(questions.signImageUrl) : undefined);

/**
 * Build a 20-question exam (sign → number → analysis → roadpic) for a user,
 * pulling only questions they haven't seen before so nothing repeats across
 * their attempts. When a group's unseen pool runs low, that group is reset
 * (its "seen" rows cleared) so it loops afresh. Questions are marked seen on
 * submit (see /api/quiz), so an un-submitted reload keeps the same set.
 */
export async function buildRotatingExam(userId?: string): Promise<Q[]> {
  const out: Q[] = [];
  for (const g of GROUPS) {
    let picked: Q[];
    if (userId) {
      const seenSub = db.select({ id: examSeen.questionId }).from(examSeen).where(eq(examSeen.userId, userId));
      picked = await db
        .select()
        .from(questions)
        .where(and(groupWhere(g.key, g.imageOnly), notInArray(questions.id, seenSub)))
        .orderBy(sql`random()`)
        .limit(g.n);

      // Group exhausted for this user → clear its seen rows and re-pick fresh.
      if (picked.length < g.n) {
        const groupIds = db.select({ id: questions.id }).from(questions).where(eq(questions.examGroup, g.key));
        await db.delete(examSeen).where(and(eq(examSeen.userId, userId), inArray(examSeen.questionId, groupIds)));
        picked = await db.select().from(questions).where(groupWhere(g.key, g.imageOnly)).orderBy(sql`random()`).limit(g.n);
      }
    } else {
      picked = await db.select().from(questions).where(groupWhere(g.key, g.imageOnly)).orderBy(sql`random()`).limit(g.n);
    }
    out.push(...picked);
  }
  return out;
}
