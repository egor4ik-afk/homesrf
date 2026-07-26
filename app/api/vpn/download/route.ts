import { NextRequest, NextResponse } from 'next/server';

// Отдаёт .conf файл как настоящее HTTP-вложение (Content-Disposition: attachment).
// Это работает во всех браузерах и встроенных webview (Telegram, ВК и т.п.),
// в отличие от client-side Blob + <a download>, которые многие in-app браузеры
// либо блокируют, либо просто открывают содержимое как текст.
//
// Авторизация тут не нужна: роут ничего не читает из БД и не раскрывает
// ничего нового — просто отдаёт обратно тот же конфиг, что клиент уже
// прислал в теле запроса (он и так был у пользователя в браузере).
export async function POST(req: NextRequest) {
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