import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Название куки зависит от того, как ты ее задаешь в lib/auth.ts (например, 'session' или 'token')
  const token = request.cookies.get('session')?.value; 
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isProfilePage = request.nextUrl.pathname.startsWith('/profile');

  // 1. Если юзер УЖЕ авторизован и нажимает "Назад" на страницу /login -> кидаем обратно в профиль
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