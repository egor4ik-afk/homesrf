import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendOtpEmail } from '@/lib/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: null }));

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // не чаще одного запроса в 60 секунд на один email
  const recent = await sql`
    SELECT id FROM otp_codes
    WHERE email = ${normalizedEmail} AND created_at > NOW() - INTERVAL '60 seconds'
    ORDER BY created_at DESC LIMIT 1
  `;
  if (recent[0]) {
    return NextResponse.json(
      { error: 'Код уже отправлен, подождите минуту перед повторной отправкой' },
      { status: 429 }
    );
  }

  const code = generateCode();
  await sql`
    INSERT INTO otp_codes (email, code, expires_at)
    VALUES (${normalizedEmail}, ${code}, NOW() + INTERVAL '10 minutes')
  `;

  try {
    await sendOtpEmail(normalizedEmail, code);
  } catch (e) {
    console.error('sendOtpEmail failed:', e);
    return NextResponse.json({ error: 'Не удалось отправить письмо, попробуйте позже' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
