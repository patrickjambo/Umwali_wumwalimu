import { NextResponse } from "next/server";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";

export async function GET() {
  const data = await db.select().from(quizAttempts);
  return NextResponse.json(data);
}
