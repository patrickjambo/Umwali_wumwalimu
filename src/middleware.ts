import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Lightweight, Edge-safe middleware using NextAuth's getToken
export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/courses');
  const isAdmin = pathname.startsWith('/admin');

  // Safely decode the token in the Edge runtime
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAdmin) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    if (token.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*', '/admin/:path*'],
};
