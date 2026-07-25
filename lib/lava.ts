import crypto from 'crypto';

/**
 * lib/lava.ts — клиент lava.top (gate.lava.top, Public API v3).
 * Замена lib/yookassa.ts: создать платёж, перепроверить статус
 * (вебхуку не доверяем), проверить аутентификацию вебхука.
 *
 * Проверено боевыми запросами 25.07:
 *  - POST /api/v3/invoice с periodicity=MONTHLY без провайдера → SMART_GLOCAL, ок;
 *  - PAY2ME (СБП) на аккаунте пока не активирован → "Restricted payment
 *    method type".
 *  - Ответ поддержки: подписку через СБП оплатить технически НЕЛЬЗЯ (нет
 *    данных карты для токена). Поэтому СБП = отдельный РАЗОВЫЙ оффер
 *    (tarifs.lava_offer_id_onetime), инвойс по нему создаётся без periodicity.
 */

const LAVA_API = 'https://gate.lava.top';

export type LavaProvider = 'SMART_GLOCAL' | 'PAY2ME' | 'UNLIMINT' | 'PAYPAL';
export type LavaMethodType = 'CARD' | 'SBP' | 'PAYPAL' | 'PIX';
export type LavaInvoiceStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface LavaInvoice {
  id: string;
  status: string; // в v3 приходит в нижнем регистре ("new"), сравниваем без регистра
  amountTotal?: { currency: string; amount: number };
  receipt?: { amount: number; currency: string; fee: number };
  buyer?: { email: string };
  subscriptionStatus?: string;
  paymentUrl?: string;
}

async function lava<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = process.env.LAVA_API_KEY;
  if (!apiKey) throw new Error('LAVA_API_KEY не задан');

  const res = await fetch(`${LAVA_API}${path}`, {
    ...init,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`lava ${path} error: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Создаёт инвойс. Два режима:
 *  - подписка (карта): createInvoice(email, offerId) — periodicity MONTHLY;
 *  - разовый (СБП):    createInvoice(email, onetimeOfferId,
 *      { provider: 'PAY2ME', methodType: 'SBP', oneTime: true }) —
 *      periodicity не передаётся, оффер должен быть разовым.
 * email — из нашей сессии, по нему вебхук приматчится обратно.
 */
export function createInvoice(
  email: string,
  offerId: string,
  opts: { provider?: LavaProvider; methodType?: LavaMethodType; oneTime?: boolean } = {}
): Promise<LavaInvoice> {
  return lava<LavaInvoice>('/api/v3/invoice', {
    method: 'POST',
    body: JSON.stringify({
      email,
      offerId,
      currency: 'RUB',
      ...(opts.provider ? { paymentProvider: opts.provider } : {}),
      ...(opts.methodType ? { paymentMethodType: opts.methodType } : {}),
      ...(opts.oneTime ? {} : { periodicity: 'MONTHLY' }),
      buyerLanguage: 'RU',
    }),
  });
}

/** Статус инвойса — источник истины после вебхука. */
export function fetchInvoiceStatus(id: string): Promise<LavaInvoice> {
  return lava<LavaInvoice>(`/api/v1/invoices/${id}`);
}

/** Инвойс считается оплаченным (v1 отдаёт COMPLETED, v3 может в lower case). */
export function isCompleted(invoice: LavaInvoice): boolean {
  return String(invoice.status).toUpperCase() === 'COMPLETED';
}

/**
 * Отмена подписки со стороны магазина (будущая кнопка «Отменить
 * автопродление» в профиле). parentContractId = provider_payment_id
 * первого succeeded-платежа lava этого пользователя.
 * Путь метода сверить в gate.lava.top/docs перед использованием.
 */
export function cancelSubscription(parentContractId: string, email: string): Promise<void> {
  return lava<void>(
    `/api/v1/subscriptions?contractId=${encodeURIComponent(parentContractId)}&email=${encodeURIComponent(email)}`,
    { method: 'DELETE' }
  );
}

// ---------------------------------------------------------------- вебхук

export type LavaEventType =
  | 'payment.success'
  | 'payment.failed'
  | 'subscription.recurring.payment.success'
  | 'subscription.recurring.payment.failed'
  | 'subscription.cancelled';

export interface LavaWebhookEvent {
  eventType: LavaEventType;
  contractId: string;
  parentContractId?: string;
  product?: { id: string; title: string };
  buyer?: { email: string };
  amount?: number;
  currency?: string;
  status?: string;
  timestamp?: string;
  errorMessage?: string;
  cancelledAt?: string;
  willExpireAt?: string;
}

/**
 * Вебхуки в кабинете настроены с аутентификацией Basic:
 * Authorization: Basic base64(LAVA_WEBHOOK_LOGIN:LAVA_WEBHOOK_PASSWORD).
 * Сравнение в постоянное время.
 */
export function verifyWebhookAuth(headerValue: string | null | undefined): boolean {
  const login = process.env.LAVA_WEBHOOK_LOGIN;
  const password = process.env.LAVA_WEBHOOK_PASSWORD;
  if (!login || !password || !headerValue) return false;

  const expected = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
  const a = Buffer.from(headerValue);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}