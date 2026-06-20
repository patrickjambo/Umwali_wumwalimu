import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Phone number a student contacts to renew/extend access.
export const SUPPORT_PHONE = "0782439519";

const DEFAULT_TRIAL_FALLBACK = 2;

/** Admin-editable default free-trial length (days) for new accounts. */
export async function getDefaultTrialDays(): Promise<number> {
  try {
    const rows = await db.select().from(appSettings).where(eq(appSettings.key, "default_trial_days")).limit(1);
    const n = parseInt(rows[0]?.value ?? "", 10);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TRIAL_FALLBACK;
  } catch {
    return DEFAULT_TRIAL_FALLBACK;
  }
}

/** Whole days left until access expires (0 if past / missing). */
export function daysRemaining(expiresAt: Date | string | null | undefined): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

type AccessUser = {
  role?: string | null;
  isActive?: boolean | null;
  accessExpiresAt?: Date | string | null;
};

/** Admins always pass; others need an active account that hasn't expired. */
export function accessActive(u: AccessUser | null | undefined): boolean {
  if (!u) return false;
  if (u.role === "admin") return true;
  if (u.isActive === false) return false;
  if (!u.accessExpiresAt) return false;
  return new Date(u.accessExpiresAt).getTime() > Date.now();
}
