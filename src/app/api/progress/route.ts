import { NextResponse } from "next/server";
import { db } from "@/db";
import { enrollments } from "@/db/schema";

export async function GET() {
  const data = await db.select().from(enrollments);
  return NextResponse.json(data);
}
