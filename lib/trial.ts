// lib/trial.ts
// ─────────────────────────────────────────────────────────────────────────
// Вся логика часового теста + продления жизни ключей.
//   startTrial()        — выдать тест на час (вызывается из /api/trial/start)
//   expireTrials()      — погасить истёкшие триалы (cron)
//   expireLapsedPro()   — погасить просроченный PRO (cron)
// Все три идемпотентны: повторный вызов на уже обработанном юзере — no-op.
// ─────────────────────────────────────────────────────────────────────────

import sql from './db';
import { issueVpnKey, revokeUserKeys } from './vpn';

export const TRIAL_MINUTES = 60;

export class TrialError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * tarif_id, чей сервер отдадим под тест. Берём самый дорогой активный
 * тариф (это PRO) — тест должен идти по тому же железу, что и платный
 * доступ, иначе он ничего не проверяет. Отдельный тариф TRIAL не нужен.
 */
async function serverTarifIdForTrial(): Promise<number> {
  const rows = await sql<{ tarif_id: number }[]>`
    SELECT tvs.tarif_id
    FROM tarif_vpn_servers tvs
    JOIN tarifs t ON t.id = tvs.tarif_id
    JOIN vpn_servers vs ON vs.id = tvs.vpn_server_id
    WHERE t.status = 'active' AND vs.is_healthy = TRUE
    ORDER BY t.price_rub DESC
    LIMIT 1
  `;
  if (!rows[0]) {
    throw new Error('Нет активного тарифа с живым сервером — тест выдать не на чем');
  }
  return rows[0].tarif_id;
}

/**
 * Выдаёт тест на час. Внутри транзакции блокируем строку пользователя,
 * чтобы двойной клик по кнопке не выдал два ключа.
 *
 * Порядок: сначала в БД помечаем «триал взят», потом выпускаем ключ.
 * Если ключ упал — снимаем метку и отдаём ошибку. Обратный порядок дал
 * бы дырку: два параллельных запроса успели бы выпустить по ключу.
 */
export async function startTrial(userId: number): Promise<{ configText: string; expiresAt: Date }> {
  const tarifId = await serverTarifIdForTrial();

  const expiresAt = await sql.begin(async (tx) => {
    const rows = await tx<
      { status: string; trial_expires_at: Date | null }[]
    >`SELECT status, trial_expires_at FROM users WHERE id = ${userId} FOR UPDATE`;
    const u = rows[0];
    if (!u) throw new TrialError('Пользователь не найден', 404);

    if (u.status === 'active') {
      throw new TrialError('У вас уже активная подписка — тест не нужен', 409);
    }
    // Единственная защита от повтора на том же аккаунте: колонка уже
    // заполнена — значит тест брали (даже если он давно истёк).
    if (u.trial_expires_at) {
      throw new TrialError('Тестовый доступ уже был использован на этом аккаунте', 409);
    }

    const updated = await tx<{ trial_expires_at: Date }[]>`
      UPDATE users SET
        status = 'trial',
        trial_expires_at = NOW() + (${TRIAL_MINUTES} || ' minutes')::interval,
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING trial_expires_at
    `;
    return updated[0].trial_expires_at;
  });

  try {
    const { configText } = await issueVpnKey(userId, tarifId);
    return { configText, expiresAt };
  } catch (e) {
    // Ключ не выдался — откатываем метку, иначе человек навсегда остался
    // без теста из-за нашей ошибки.
    await sql`
      UPDATE users SET status = 'inactive', trial_expires_at = NULL, updated_at = NOW()
      WHERE id = ${userId} AND status = 'trial'
    `;
    throw e;
  }
}

/**
 * Гасит истёкшие триалы. Возвращает счётчики.
 *
 * «Захват» строк одним атомарным UPDATE в промежуточный статус 'expiring':
 * следующий тик cron их уже не увидит, а долгий SSH к ноде не держит
 * ни блокировки, ни открытую транзакцию. Строки, застрявшие в 'expiring'
 * дольше 15 минут (процесс упал между захватом и снятием пира), берём
 * заново.
 */
export async function expireTrials(): Promise<{ done: number; failed: number }> {
  const claimed = await sql<{ id: number }[]>`
    UPDATE users SET status = 'expiring', updated_at = NOW()
    WHERE id IN (
      SELECT id FROM users
      WHERE trial_expires_at IS NOT NULL
        AND trial_expires_at < NOW()
        AND (
          status = 'trial'
          OR (status = 'expiring' AND updated_at < NOW() - INTERVAL '15 minutes')
        )
      LIMIT 200
    )
    RETURNING id
  `;

  let done = 0;
  let failed = 0;
  for (const { id } of claimed) {
    try {
      await revokeUserKeys(id); // снимает пиры с нод + revoked_at
      await sql`
        UPDATE users SET status = 'expired', updated_at = NOW()
        WHERE id = ${id} AND status = 'expiring'
      `;
      done++;
    } catch (e) {
      // Возвращаем в 'trial', чтобы следующий тик попробовал снова.
      // Ставить 'expired' нельзя: в базе будет «закрыт», а на сервере —
      // живой пир, и человек продолжит пользоваться бесплатно.
      console.error(`expireTrials: user=${id} не закрыт:`, e);
      await sql`UPDATE users SET status = 'trial' WHERE id = ${id} AND status = 'expiring'`;
      failed++;
    }
  }
  return { done, failed };
}

/**
 * Гасит PRO, у которого истёк оплаченный срок и НЕ пришло продление.
 *
 * Важно про «списание»: сам платёж за следующий месяц инициирует Lava
 * (регулярный вебхук subscription.recurring.payment.*), а НЕ этот cron.
 * Инициировать списание из планировщика нельзя — деньги двигает только
 * платёжка. Задача cron другая: если срок прошёл, а продления так и не
 * было (карта отвалилась, подписку отменили), — отозвать ключи и
 * перевести в expired, чтобы доступ не оставался бесплатно навсегда.
 *
 * Небольшой грейс в 10 минут: не воюем с вебхуком продления, который
 * мог прийти впритык к сроку.
 */
export async function expireLapsedPro(): Promise<{ done: number; failed: number }> {
  const claimed = await sql<{ id: number }[]>`
    UPDATE users SET status = 'expiring_pro', updated_at = NOW()
    WHERE id IN (
      SELECT id FROM users
      WHERE subscription_expires_at IS NOT NULL
        AND subscription_expires_at < NOW() - INTERVAL '10 minutes'
        AND (
          status = 'active'
          OR (status = 'expiring_pro' AND updated_at < NOW() - INTERVAL '15 minutes')
        )
      LIMIT 200
    )
    RETURNING id
  `;

  let done = 0;
  let failed = 0;
  for (const { id } of claimed) {
    try {
      await revokeUserKeys(id);
      await sql`
        UPDATE users SET status = 'expired', updated_at = NOW()
        WHERE id = ${id} AND status = 'expiring_pro'
      `;
      done++;
    } catch (e) {
      console.error(`expireLapsedPro: user=${id} не закрыт:`, e);
      await sql`UPDATE users SET status = 'active' WHERE id = ${id} AND status = 'expiring_pro'`;
      failed++;
    }
  }
  return { done, failed };
}

/**
 * Апгрейд триала в PRO БЕЗ смены ключа. Триальный пир на ноде уже живой
 * и проверенный человеком — оставляем его, просто снимаем «часовую» метку
 * trial_expires_at, чтобы cron (expireTrials) больше не считал юзера
 * триальщиком и не снял ключ через час. Новый ключ НЕ выпускаем.
 *
 * Возвращает config_text усыновлённого ключа, либо null — если усыновлять
 * нечего (не триал / ключ уже снят cron'ом после истечения часа). В случае
 * null вебхук выдаёт новый ключ как обычно.
 *
 * status и subscription_expires_at здесь НЕ трогаем — их выставит вебхук
 * ниже по коду тем же UPDATE, что и для обычной оплаты.
 */
export async function adoptTrialKeyAsPro(userId: number): Promise<string | null> {
  const rows = await sql<{ status: string }[]>`SELECT status FROM users WHERE id = ${userId}`;
  if (rows[0]?.status !== 'trial') return null;

  const keys = await sql<{ config_text: string }[]>`
    SELECT config_text FROM vpn_clients
    WHERE user_id = ${userId} AND revoked_at IS NULL AND config_text IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1
  `;
  if (!keys[0]) return null; // живого триал-ключа нет — пусть выдаётся новый

  // Снимаем часовую метку: с этого момента сроком рулит subscription_expires_at.
  await sql`UPDATE users SET trial_expires_at = NULL WHERE id = ${userId}`;
  return keys[0].config_text;
}
