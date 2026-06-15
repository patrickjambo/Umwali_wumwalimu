import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db) as any,
  providers: [
    ...authConfig.providers,
    Resend({
      apiKey: process.env.RESEND_API_KEY || 're_123',
      from: 'noreply@amategeko.rw',
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const userResult = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
        const user = userResult[0];

        if (!user || !user.passwordHash) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isPasswordValid) return null;

        return user;
      }
    }),
  ],
});
