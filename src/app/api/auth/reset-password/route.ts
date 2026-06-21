import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  let token = "";
  let password = "";
  try {
    ({ token, password } = await req.json());
  } catch {
    return NextResponse.json({ message: "Ubusabe ntibwemewe." }, { status: 400 });
  }

  token = String(token || "").trim();
  password = String(password || "");
  if (!token) return NextResponse.json({ message: "Token ibuze." }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ message: "Ijambo banga rigomba kuba nibura inyuguti 6." }, { status: 400 });
  }

  const row = (await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1))[0];
  if (!row || new Date(row.expires).getTime() < Date.now()) {
    return NextResponse.json({ message: "Iyi link yarangiye cyangwa ntiyemewe. Ongera usabe gusubiramo." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
  // Invalidate all reset tokens for this user.
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));

  return NextResponse.json({ message: "Ijambo banga ryahinduwe neza." });
}
