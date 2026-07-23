export const SESSION_COOKIE = 'session_token';
export const SESSION_TTL_DAYS = 30;

// Не через env: NEXT_PUBLIC_* инлайнится в бандл на этапе `next build`,
// а не читается в рантайме контейнера — если билд-система не прокинула
// переменную как build-arg, в бандле останется пусто/плейсхолдер.
// Ссылка стабильная и меняется редко — проще держать её как константу.
export const DOWNLOADS_URL = 'https://m-c1f05afcfdff-3w5hsuiikq-ez.a.run.app/ru/downloads';
