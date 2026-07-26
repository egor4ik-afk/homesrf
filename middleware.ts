import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isProfilePage = request.nextUrl.pathname.startsWith('/profile');

  // 1. Если юзер УЖЕ авторизован и заходит на /login -> кидаем в профиль
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // 2. Если юзер НЕ авторизован и лезет в /profile -> кидаем на логин
  if (!token && isProfilePage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/login'],
};