import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Role is read fresh from the DB (never the session token, which is only set at
// login and can be stale on another device after a role change).
export async function currentUserRole(): Promise<string | null> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  const r = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  return r[0]?.role ?? null;
}

export async function isAdmin(): Promise<boolean> {
  return (await currentUserRole()) === "admin";
}

/** Throw when the current user is not an admin — for guarding server actions. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("forbidden");
}
