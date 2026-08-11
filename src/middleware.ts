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
    // Only require being logged in here. The admin ROLE is verified against the
    // DB in the (admin) layout + server actions, so a stale token role (e.g. an
    // older login on another device) can't lock a real admin out of /admin.
    if (!session) return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/admin/:path*'],
};
