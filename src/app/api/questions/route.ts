import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";

export async function GET() {
  const data = await db.select().from(questions);
  return NextResponse.json(data);
}
