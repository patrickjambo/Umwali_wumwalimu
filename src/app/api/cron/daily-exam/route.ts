import { NextResponse } from "next/server";
import { runDailyExamFromSettings } from "@/lib/daily-exam";

export const dynamic = "force-dynamic";

// Called daily by Vercel Cron. Protected by CRON_SECRET when set (Vercel sends
// `Authorization: Bearer $CRON_SECRET`). Unprotected only when no secret is set
// (e.g. local dev).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const result = await runDailyExamFromSettings();
  return NextResponse.json(result);
}
