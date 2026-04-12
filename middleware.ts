import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/crm')) {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      })
    }

    const base64 = authHeader.slice(6)
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
    const [login, password] = decoded.split(':')

    if (
      login !== process.env.ADMIN_LOGIN ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/crm/:path*'],
}