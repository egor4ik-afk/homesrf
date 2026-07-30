// // instrumentation.ts  (в КОРНЕ проекта, рядом с next.config.*)
// // ─────────────────────────────────────────────────────────────────────────
// // Next.js вызывает register() один раз при старте сервера. Здесь стартуем
// // планировщик — но только в Node-рантайме (не в Edge и не в браузере),
// // иначе node-cron и ssh2 туда не импортируются.
// //
// // ВНИМАНИЕ по версии Next:
// //   • Next 15+  — instrumentation работает из коробки, ничего не нужно.
// //   • Next 13/14 — включи в next.config.js:
// //         experimental: { instrumentationHook: true }
// // ─────────────────────────────────────────────────────────────────────────

// export async function register() {
//     if (process.env.NEXT_RUNTIME === 'nodejs') {
//       const { startScheduler } = await import('./lib/scheduler');
//       startScheduler();
//     }
//   }