const YOOKASSA_API = 'https://api.yookassa.ru/v3';

function authHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID || '';
  const secretKey = process.env.YOOKASSA_SECRET_KEY || '';
  return 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64');
}

export interface YooKassaPayment {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  confirmation?: { type: string; confirmation_url: string };
  payment_method?: {
    type: string;
    id: string;
    saved: boolean;
    card?: { last4: string; card_type: string };
  };
  metadata?: Record<string, unknown>;
}

export async function createPayment(
  amountRub: number,
  description: string,
  metadata: Record<string, unknown>
): Promise<YooKassaPayment> {
  const idempotenceKey = crypto.randomUUID();

  const res = await fetch(`${YOOKASSA_API}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: { value: amountRub.toFixed(2), currency: 'RUB' },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.APP_URL}/profile?payment=success`,
      },
      capture: true,
      description,
      // Просим ЮKassa сохранить карту — своё согласие/чекбокс на сохранение
      // пользователю показывает сама ЮKassa на странице оплаты. Если пользователь
      // не согласится, payment_method.saved в ответе просто будет false —
      // ничего сохранять не станем (см. webhook).
      save_payment_method: true,
      metadata,
    }),
  });

  if (!res.ok) {
    throw new Error(`YooKassa createPayment error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Телу вебхука не доверяем напрямую (ЮKassa не подписывает вебхуки секретом
 * по умолчанию) — перезапрашиваем статус платежа по его id из самой ЮKassa.
 */
export async function fetchPaymentStatus(paymentId: string): Promise<YooKassaPayment> {
  const res = await fetch(`${YOOKASSA_API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    throw new Error(`YooKassa fetchPaymentStatus error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
