// middleware.ts  →  ЗАМЕНИТЬ ЦЕЛИКОМ
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { locales, defaultLocale } from '@/i18n/config';
 
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  // ru без префикса (/), остальные с префиксом (/en, /es...).
  // 'as-needed' — дефолтная локаль в URL не мусорит.
  localePrefix: 'as-needed',
});
 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
 
  // Пути без локали-префикса для проверки auth: /en/profile → /profile
  const stripLocale = pathname.replace(
    new RegExp(`^/(${locales.join('|')})(?=/|$)`),
    '',
  );
  const isLogin = stripLocale === '/login' || stripLocale === '';
  const isProfile = stripLocale.startsWith('/profile');
 
  if (token && stripLocale === '/login') {
    return NextResponse.redirect(new URL('/profile', request.url));
  }
  if (!token && isProfile) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
 
  // Всё остальное отдаём i18n-мидлвари (она разложит локаль/редиректы).
  return intlMiddleware(request);
}
 
export const config = {
  // Ловим всё, кроме статики и API. API локализовать не нужно.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};