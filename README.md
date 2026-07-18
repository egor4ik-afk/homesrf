# RelaxNet — MVP

Один Next.js-сервис (фронт + API-роуты как временный Gateway) для первого запуска
RelaxNet.pro: лендинг, вход по email+OTP, профиль с тарифом PRO, оплата через
ЮKassa, выдача VPN-ключа и письмо с инструкцией через nodemailer.

Максимально переиспользована инфраструктура проекта Relaxdev: `lib/db.ts`
(postgres.js с safe-url на этапе сборки), паттерн cookie-based авторизации,
Docker + Traefik деплой.

## Что внутри

```
app/
  page.tsx              — лендинг /
  privacy/, terms/       — черновики, нужна юридическая проверка
  login/                 — вход email → OTP (2 шага)
  profile/               — статус тарифа, оплата, ключ, скачивание клиента
  api/
    auth/otp/request      — POST, отправляет код на email
    auth/otp/verify        — POST, проверяет код, выдаёт сессию (httpOnly cookie)
    auth/logout             — POST
    profile                  — GET, для поллинга статуса после оплаты
    payment/create             — POST, создаёт платёж в ЮKassa
    payment/webhook              — POST, вебхук ЮKassa → активация тарифа + ключ + письмо
lib/
  db.ts        — подключение к Postgres (Neon)
  auth.ts      — чтение текущего пользователя по сессии
  constants.ts — SESSION_COOKIE (отдельно от auth.ts, чтобы не тянуть postgres.js в middleware/Edge)
  mailer.ts    — nodemailer: OTP-письмо и письмо с ключом
  yookassa.ts  — создание платежа + проверка статуса напрямую в ЮKassa (вебхуку не доверяем)
  vpn.ts       — ЗАГЛУШКА выдачи ключа, см. ниже
db/schema.sql  — вся схема + сид (тариф PRO, скрытый STD, плейсхолдер-сервер)
```

## Локальный запуск

```bash
npm install
cp .env.example .env   # заполнить DATABASE_URL, SMTP_*, YOOKASSA_*
```

Применить схему к БД:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

```bash
npm run dev
```

## Переменные окружения

См. `.env.example`. Ключевые:

- `DATABASE_URL` — та самая общая БД, к которой позже подключится Orchestrator/Gateway
- `SMTP_*` — сервер для nodemailer (OTP-коды и письмо с ключом)
- `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` — берутся в личном кабинете ЮKassa;
  на старте можно использовать тестовый магазин (тестовые карты ЮKassa)
- `NEXT_PUBLIC_DOWNLOADS_URL` — ссылка на скачивание клиента (уже проставлена)

В личном кабинете ЮKassa нужно указать webhook URL:
`https://relaxnet.pro/api/payment/webhook` на события `payment.succeeded`.

## Про lib/vpn.ts — важно

Сейчас `issueVpnKey()` — это **заглушка**: она выбирает VPN-сервер, привязанный
к тарифу (таблица `tarif_vpn_servers`), и генерирует случайный ключ, ничего не
запрашивая у реального VPN-сервера. Это сделано специально, чтобы можно было
прогнать весь флоу (оплата → активация → письмо) ещё до того, как поднят
настоящий оркестратор.

Когда будете выносить API Gateway в отдельное NestJS-приложение (как и
планировали) — эта функция заменяется вызовом к Gateway: healthcheck сервера +
"Request VPN Key" точно как на исходной диаграмме. БД уже общая, так что
разрывать ничего не придётся — просто `lib/vpn.ts` в Next.js начинает делать
HTTP-запрос к Gateway вместо прямой генерации.

## Деплой (Relaxdev, Docker + Traefik)

```bash
docker compose up -d --build
```

DNS `relaxnet.pro` → на IP Relaxdev, сертификат — Let's Encrypt через Traefik
ACME, как и у остальных проектов на этой инфраструктуре.

## Известные допущения (проверить перед продакшеном)

- Тариф в MVP один — PRO, 299 ₽ / 30 дней. STD заведён в БД, но скрыт
  (`status = 'hidden'`) — включается без миграций через UPDATE.
- ЮKassa настроена на рубли; для не-RU аудитории (домен `.pro`) в будущем
  потребуется либо второй провайдер, либо смена юрлица.
- VPN-ключ показывается и в письме, и в профиле — если нужно отдавать его
  только через почту, уберите блок с ключом в `components/ProfileClient.tsx`
  и не пишите `vpn_key` в таблицу `users` (или храните хешированным).
- Rate-limit на OTP — простой (1 запрос/60 сек на email, in-DB), без защиты от
  распределённого перебора. Для продакшена стоит добавить IP-based лимит.
- `/privacy` и `/terms` — черновики, требуют юридической проверки перед запуском.
