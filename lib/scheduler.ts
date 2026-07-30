// lib/scheduler.ts
// ─────────────────────────────────────────────────────────────────────────
// Планировщик внутри приложения. Стартует один раз при запуске сервера
// (см. instrumentation.ts) и каждые 10 минут гасит истёкшие триалы и
// просроченный PRO. Внешний cron/эндпоинт не нужен.
//
// Защита от двойного запуска:
//   • globalThis-флаг — dev-режим Next иногда исполняет модуль дважды;
//   • runningNow — не запускаем новый тик, пока прошлый не закончил
//     (SSH к нодам может быть дольше 10 минут при большой пачке).
//
// Одна реплика контейнера — идеально. Если реплик несколько, тик
// отработает в каждой; дублей ключей не будет (гашение идёт через
// атомарный захват строки в статус 'expiring'), но пиры будут снимать
// двое — просто лишняя работа. Для этого случая вынеси cron в отдельный
// воркер-контейнер (запусти этот же модуль там и убери из web).
// ─────────────────────────────────────────────────────────────────────────

import cron from 'node-cron';
import { expireTrials, expireLapsedPro } from './trial';

const g = globalThis as unknown as { __relaxnetCronStarted?: boolean };
let runningNow = false;

async function tick() {
  if (runningNow) {
    console.warn('[cron] предыдущий тик ещё идёт — пропускаю');
    return;
  }
  runningNow = true;
  try {
    const t = await expireTrials();
    const p = await expireLapsedPro();
    if (t.done || t.failed || p.done || p.failed) {
      console.log(
        `[cron] триалов закрыто=${t.done} ошибок=${t.failed}; PRO закрыто=${p.done} ошибок=${p.failed}`,
      );
    }
  } catch (e) {
    console.error('[cron] тик упал:', e);
  } finally {
    runningNow = false;
  }
}

export function startScheduler() {
  if (g.__relaxnetCronStarted) return;
  g.__relaxnetCronStarted = true;

  // Каждые 10 минут. Пятое поле — */10 минут.
  cron.schedule('*/10 * * * *', tick);

  // Один прогон вскоре после старта — вдруг сервер простоял, и что-то
  // уже давно должно было погаснуть. Не в самый момент старта, чтобы не
  // конкурировать с прогревом соединений к БД.
  setTimeout(() => void tick(), 15_000);

  console.log('[cron] планировщик запущен: истечение триалов и PRO каждые 10 минут');
}