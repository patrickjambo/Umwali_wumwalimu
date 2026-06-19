import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";
import { auth } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const data = await db.select().from(quizAttempts);
  return NextResponse.json(data);
}

// Record a finished quiz attempt (drives dashboard progress).
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { moduleId?: string; kind?: string; score?: number; passed?: boolean; answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { moduleId, kind, score, passed, answers } = body;
  const isExam = kind === "exam";
  // Module quizzes need a real module id; exams have none. Skip dummy/preview ids.
  if (!isExam && (!moduleId || !UUID.test(moduleId))) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  try {
    await db.insert(quizAttempts).values({
      userId,
      moduleId: isExam ? null : moduleId,
      kind: isExam ? "exam" : "module",
      score: String(Math.min(100, Math.max(0, Math.round(Number(score) || 0)))),
      passed: Boolean(passed),
      answers: Array.isArray(answers) ? answers : [],
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "could not save attempt" }, { status: 500 });
  }
}
