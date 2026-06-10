import { NextResponse } from 'next/server';
import { db } from '@/db';
import { certificates } from '@/db/schema';

export async function GET() {
  const data = await db.select().from(certificates);
  return NextResponse.json(data);
}
