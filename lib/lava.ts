import crypto from 'crypto';

/**
 * Клиент lava.top (gate.lava.top, Public API).
 * Замена lib/yookassa.ts. Стиль и роль те же: создать платёж,
 * перепроверить статус (вебхуку не доверяем), проверить аутентификацию вебхука.
 *
 * Отличия от ЮKassa:
 *  - платёж создаётся не суммой, а offerId "продукта" из каталога lava —
 *    сумма назначена оффером (tarifs.lava_offer_id);
 *  - рекуррент = periodicity MONTHLY при создании инвойса, продления приходят
 *    отдельным типом вебхука с parentContractId;
 *  - вебхук аутентифицируется секретом в заголовке (настраивается в кабинете),
 *    криптоподписи тела нет.
 */

const LAVA_API = 'https://gate.lava.top';

export type LavaInvoiceStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface LavaInvoice {
  id: string;
  type: 'ONE_TIME' | 'RECURRING';
  status: LavaInvoiceStatus;
  datetime: string;
  receipt?: { amount: number; currency: string; fee: number };
  buyer?: { email: string };
  product?: { name: string; offer: string };
  subscriptionStatus?: 'ACTIVE' | 'CANCELLED' | 'FAILED';
  subscriptionDetails?: { expiredAt: string };
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
 * Создаёт инвойс-подписку. email обязателен — он же связывает
 * платёж с аккаунтом на стороне lava, поэтому передаём email из нашей
 * сессии, а не свободный ввод.
 */
export function createInvoice(email: string, offerId: string): Promise<LavaInvoice> {
  return lava<LavaInvoice>('/api/v2/invoice', {
    method: 'POST',
    body: JSON.stringify({
      email,
      offerId,
      currency: 'RUB',
      periodicity: 'MONTHLY',
      buyerLanguage: 'RU',
    }),
  });
}

/** Статус инвойса — источник истины после вебхука. */
export function fetchInvoiceStatus(id: string): Promise<LavaInvoice> {
  return lava<LavaInvoice>(`/api/v1/invoices/${id}`);
}

/**
 * Отмена подписки со стороны магазина (кнопка «отменить» в нашем профиле).
 * Путь метода сверить в интерактивной доке developers.lava.top — помечено
 * и в PATCH-NOTES.
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
 * Вебхук lava с аутентификацией Basic: заголовок
 * Authorization: Basic base64(login:password).
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
