// app/api/trial/start/route.ts
// ─────────────────────────────────────────────────────────────────────────
// POST /api/trial/start — выдать тест на час залогиненному пользователю.
// Отдельного анонимного триала нет: без email мы не сможем ни ограничить
// повтор, ни напомнить о конце теста. Вход остаётся через email+OTP.
// ─────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { startTrial, TrialError, TRIAL_MINUTES } from '@/lib/trial';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Войдите, чтобы взять тест' }, { status: 401 });
  }

  try {
    const { configText, expiresAt } = await startTrial(user.id);
    return NextResponse.json({
      config: configText,
      expiresAt: expiresAt.toISOString(),
      minutes: TRIAL_MINUTES,
    });
  } catch (e) {
    if (e instanceof TrialError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('startTrial failed:', e);
    return NextResponse.json(
      { error: 'Не удалось выдать тестовый ключ. Попробуйте через минуту или напишите в поддержку.' },
      { status: 500 },
    );
  }
}