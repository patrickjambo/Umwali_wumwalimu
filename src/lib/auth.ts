import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db) as any,
  providers: [
    Google({ 
      clientId: process.env.GOOGLE_ID || '', 
      clientSecret: process.env.GOOGLE_SECRET || '' 
    }),
    Resend({ 
      apiKey: process.env.RESEND_API_KEY || 're_123', 
      from: 'noreply@amategeko.rw' 
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
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    jwt: async ({ token, user }) => { 
      if (user) {
         token.role = (user as any).role || 'student';
         token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user && token) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
});
