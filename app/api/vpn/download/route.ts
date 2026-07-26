import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Отдаёт .conf файл как настоящее HTTP-вложение (Content-Disposition: attachment).
// Это работает во всех браузерах и встроенных webview (Telegram, ВК и т.п.),
// в отличие от client-side Blob + <a download>, которые многие in-app браузеры
// либо блокируют, либо просто открывают содержимое как текст.
export async function POST(req: NextRequest) {
  // Простая защита от постороннего использования эндпоинта как открытого echo-сервиса —
  // конфиг и так уже есть у пользователя в браузере, но раздавать файлы
  // неавторизованным запросам смысла нет.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const config = formData?.get('config');
  const filename = formData?.get('filename');

  if (typeof config !== 'string' || !config.trim()) {
    return NextResponse.json({ error: 'Пустой конфиг' }, { status: 400 });
  }

  const safeFileName = (typeof filename === 'string' && filename.trim())
    ? filename.replace(/[^a-zA-Z0-9_\-]/g, '_')
    : 'amnezia';

  return new NextResponse(config, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFileName}.conf"`,
      'Cache-Control': 'no-store',
    },
  });
}