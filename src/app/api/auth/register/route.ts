import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDefaultTrialDays } from '@/lib/access';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // New accounts start on a free trial (admin-configurable, default 2 days).
    const trialDays = await getDefaultTrialDays();
    const accessExpiresAt = new Date(Date.now() + trialDays * 86_400_000);

    await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: 'student',
      isActive: true,
      accessExpiresAt,
    });

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "An error occurred while registering the user" }, { status: 500 });
  }
}
