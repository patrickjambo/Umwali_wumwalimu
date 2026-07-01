"use server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, appSettings } from "@/db/schema";
import { eq, and, or, ne, lt, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    throw new Error("forbidden");
  }
}

export async function setUserActive(userId: string, active: boolean) {
  await requireAdmin();
  await db.update(users).set({ isActive: active }).where(eq(users.id, userId));
  revalidatePath("/admin");
}

async function addDaysInternal(userId: string, days: number) {
  const u = (await db.select({ exp: users.accessExpiresAt }).from(users).where(eq(users.id, userId)).limit(1))[0];
  const now = Date.now();
  // Extend from the later of now / current expiry so unused time isn't lost.
  const baseMs = u?.exp && new Date(u.exp).getTime() > now ? new Date(u.exp).getTime() : now;
  const next = new Date(baseMs + days * 86_400_000);
  await db.update(users).set({ accessExpiresAt: next, isActive: true }).where(eq(users.id, userId));
}

// Preset buttons (+2 days, +1 week, +1 month, -1 week...).
export async function addUserDays(userId: string, days: number) {
  await requireAdmin();
  await addDaysInternal(userId, days);
  revalidatePath("/admin");
}

// Custom amount from a per-row input (can be negative to reduce).
export async function addUserDaysForm(userId: string, formData: FormData) {
  await requireAdmin();
  const d = parseInt(String(formData.get("days") ?? "0"), 10);
  if (Number.isFinite(d) && d !== 0) await addDaysInternal(userId, d);
  revalidatePath("/admin");
}

// Admin-editable default free-trial length. Saving it (a) sets what new
// accounts get and (b) grants every existing student AT LEAST that many days
// from now — extending anyone below it, never shortening users who have more.
export async function setDefaultTrialForm(formData: FormData) {
  await requireAdmin();
  const d = parseInt(String(formData.get("days") ?? ""), 10);
  if (!Number.isFinite(d) || d < 0) {
    revalidatePath("/admin");
    return;
  }

  await db
    .insert(appSettings)
    .values({ key: "default_trial_days", value: String(d) })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: String(d) } });

  // Apply to existing non-admin users: bump expiry up to now+d days for anyone
  // currently below it (don't reduce longer/paid access, don't touch admins).
  const target = new Date(Date.now() + d * 86_400_000);
  await db
    .update(users)
    .set({ accessExpiresAt: target })
    .where(
      and(
        or(isNull(users.role), ne(users.role, "admin")),
        or(isNull(users.accessExpiresAt), lt(users.accessExpiresAt, target)),
      ),
    );

  revalidatePath("/admin");
}
