import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const GENERIC = "Niba iyi email ifite konti, twoherereje uburyo bwo gusubiramo ijambo ry'ibanga (reba muri email yawe).";

export async function POST(req: Request) {
  let email = "";
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ message: "Ubusabe ntibwemewe." }, { status: 400 });
  }
  email = String(email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ message: GENERIC });

  const user = (await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1))[0];
  // Never reveal whether the account exists.
  if (!user) return NextResponse.json({ message: GENERIC });

  // One active reset token per user.
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.insert(passwordResetTokens).values({ token, userId: user.id, expires });

  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const link = `${base}/reset-password?token=${token}`;

  const key = process.env.RESEND_API_KEY;
  let emailed = false;
  let emailError: string | null = null;
  if (key && key !== "re_123") {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(key);
      // Default to Resend's shared sender, which needs NO domain verification
      // (it can only deliver to your own Resend-account email until you verify
      // a domain and set RESEND_FROM to e.g. noreply@your-domain).
      const from = process.env.RESEND_FROM || "Amategeko <onboarding@resend.dev>";
      const result = await resend.emails.send({
        from,
        to: email,
        subject: "Gusubiramo ijambo ry'ibanga — Amategeko y'Umuhanda",
        html: `<p>Muraho ${user.name ?? ""},</p>
<p>Wasabye gusubiramo ijambo ry'ibanga. Kanda kuri iyi link kugira ngo ushyireho irishya (rimara isaha 1):</p>
<p><a href="${link}">${link}</a></p>
<p>Niba atari wowe wabisabye, irengagize ubu butumwa.</p>`,
      });
      // Resend returns { data, error } rather than throwing on API errors.
      if (result?.error) {
        emailError = `${result.error.name ?? "error"}: ${result.error.message ?? ""}`;
      } else {
        emailed = true;
      }
    } catch (e) {
      emailError = e instanceof Error ? e.message : "send failed";
    }
  } else {
    emailError = "RESEND_API_KEY not set";
  }
  console.log(`[password-reset] for ${email}: ${link} | emailed=${emailed}${emailError ? ` | error=${emailError}` : ""}`);

  // If the email didn't go out (no key / unverified domain / dev), surface the
  // link in non-production so reset still works; include the reason to debug.
  if (!emailed && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ message: GENERIC, devResetLink: link, emailError });
  }
  return NextResponse.json({ message: GENERIC });
}
