import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import sql from '@/lib/db';
import { SESSION_COOKIE, SESSION_TTL_DAYS } from '@/lib/constants';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const { email, code } = await req.json().catch(() => ({ email: null, code: null }));

  if (!email || !code) {
    return NextResponse.json({ error: 'email и code обязательны' }, { status: 400 });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const rows = await sql`
    SELECT id, code, expires_at, attempts FROM otp_codes
    WHERE email = ${normalizedEmail}
    ORDER BY created_at DESC LIMIT 1
  `;
  const record = rows[0];

  if (!record) {
    return NextResponse.json({ error: 'Код не найден, запросите новый' }, { status: 400 });
  }
  if (new Date(record.expires_at as string) < new Date()) {
    return NextResponse.json({ error: 'Код истёк, запросите новый' }, { status: 400 });
  }
  if ((record.attempts as number) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Слишком много попыток, запросите новый код' }, { status: 429 });
  }
  if (record.code !== code) {
    await sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${record.id}`;
    return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
  }

  // код верный — находим или создаём пользователя
  const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
  let userId: number;
  if (existing[0]) {
    userId = existing[0].id as number;
  } else {
    const inserted = await sql`
      INSERT INTO users (email, status) VALUES (${normalizedEmail}, 'inactive') RETURNING id
    `;
    userId = inserted[0].id as number;
  }

  await sql`DELETE FROM otp_codes WHERE email = ${normalizedEmail}`;

  const token = crypto.randomBytes(32).toString('hex');
  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, NOW() + (${SESSION_TTL_DAYS} || ' days')::interval)
  `;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
  });
  return res;
}
