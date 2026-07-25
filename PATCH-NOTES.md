# Патч: ЮKassa → lava.top

## Файлы

| Файл | Действие |
|---|---|
| `lib/lava.ts` | новый — клиент lava (замена роли `lib/yookassa.ts`) |
| `app/api/payment/create/route.ts` | заменить целиком |
| `app/api/payment/webhook/route.ts` | заменить целиком |
| `lib/mailer.ts` | добавить `sendRenewalEmail` (ниже) |
| `db/migrations/2026-07-lava.sql` | прогнать на БД |
| `prisma/schema.prisma` | синхронно добавить поле (ниже) |
| `lib/yookassa.ts`, `app/api/payment/unlink-card/route.ts` | пока НЕ удалять, см. «Карта» |

## SQL (db/migrations/2026-07-lava.sql)

```sql
-- оффер lava, которым создаётся платёж по тарифу
ALTER TABLE tarifs ADD COLUMN IF NOT EXISTS lava_offer_id TEXT;

-- актуализация тарифа: PRO 199 ₽ (было 299)
UPDATE tarifs SET price_rub = 199.00 WHERE name = 'PRO';

-- offerId берётся в кабинете lava после создания продукта-подписки:
-- UPDATE tarifs SET lava_offer_id = '<uuid-оффера>' WHERE name = 'PRO';
```

`max_connections` для PRO пока не трогаем: в панели VPN-сервера
(documentation/alternative-clients) надо посмотреть, 3 или 5 подключений
допускает один конфиг — это решит, слоты у нас или один общий конфиг,
и это следующий шаг после оплаты.

## prisma/schema.prisma — в model Tarif добавить

```prisma
  lavaOfferId    String? @map("lava_offer_id")
```

## lib/mailer.ts — добавить в конец

```ts
export async function sendRenewalEmail(to: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Подписка RelaxNet продлена',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">RelaxNet</h2>
        <p style="color:#444">Оплата прошла, подписка продлена ещё на месяц.
        Ключ подключения не изменился — ничего перенастраивать не нужно.</p>
        <p style="color:#888;font-size:13px">Управление подпиской — в профиле на relaxnet.pro.</p>
      </div>
    `,
  });
}
```

## .env — добавить, старые YOOKASSA_* можно оставить до удаления кода

```
LAVA_API_KEY=          # кабинет lava.top → Интеграции → API key
LAVA_WEBHOOK_SECRET=   # значение, заданное вебхукам в кабинете
```

## Кабинет lava.top — руками, без этого не заработает

1. Создать продукт типа «подписка» PRO, цена 199 ₽, период — месяц.
   Его offerId → `UPDATE tarifs SET lava_offer_id = ...`.
2. Интеграции → создать API key → `LAVA_API_KEY`.
3. Создать ДВА вебхука на `https://relaxnet.pro/api/payment/webhook`:
   - тип «Результат платежа» (первый платёж),
   - тип «Регулярный платёж» (продления).
   Без второго автосписания будут проходить у lava, но мы о них не узнаем.
   Аутентификация обоих — Api key, значение → `LAVA_WEBHOOK_SECRET`.
4. Исходящий IP lava — 158.160.60.174, при желании зажать на Traefik.

## Что изменилось в логике webhook (не только провайдер)

1. **Исправлен порядок succeeded/ключ.** Раньше платёж помечался succeeded
   до выдачи ключа: упади выдача — ретрай вебхука упирался в идемпотентность
   и ключ терялся навсегда. Теперь succeeded ставится после выдачи, при
   падении возвращаем 502 и lava ретраит.
2. **FOR UPDATE** на строке платежа — два параллельных вебхука больше
   не обрабатываются оба.
3. **Продления**: отдельная ветка по `parentContractId`, новая строка в
   payments, `GREATEST(expires_at, NOW()) + 30 дней`, ключ не перевыпускается.
4. **Отмена подписки** ≠ отзыв ключа: период оплачен, доступ до конца срока.

## Карта / отвязка

Сохранённой карты в терминах ЮKassa больше нет — рекуррентом управляет lava.
`users.payment_method_id/card_last4/card_type` перестанут заполняться,
блок «карта» в ProfileClient со временем заменить на кнопку «Отменить
подписку» → `cancelSubscription(parentContractId, email)` из lib/lava.ts
(точный путь метода сверить в интерактивной доке developers.lava.top —
у меня не было доступа к их Swagger). Это отдельный маленький патч по профилю,
в этот не включён, чтобы не мешать проверке оплаты.

## Как проверить весь цикл

1. В кабинете создать второй скрытый оффер за минимальную сумму (10 ₽).
2. Временно подставить его offerId тарифу → пройти оплату → убедиться:
   payments succeeded, users active, письмо пришло.
3. Дёрнуть вебхук руками с неверным секретом → должен быть 401.
4. Повторно послать тот же payment.success → должен быть ok без второй выдачи.
