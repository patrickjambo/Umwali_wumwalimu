import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

// Decode the session with the same Auth.js config that created it. getToken()
// could not reliably read the v5 (encrypted) session cookie, which redirected
// logged-in users back to /login.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/courses');
  const isAdmin = pathname.startsWith('/admin');

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAdmin) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url));
    if ((session.user as any)?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/admin/:path*'],
};
