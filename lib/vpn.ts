import crypto from 'crypto';
import sql from './db';

/**
 * TODO(gateway): сейчас это заглушка, чтобы можно было прогнать весь флоу
 * оплата → ключ → письмо без реального VPN-сервера. Когда API Gateway будет
 * вынесен в отдельное NestJS-приложение (та же общая БД), эта функция
 * заменяется на реальный HTTP-запрос к Gateway: "Request VPN Key" →
 * healthcheck сервера → выдача конфига, как на исходной диаграмме.
 */
export async function issueVpnKey(userId: number, tarifId: number): Promise<string> {
  const rows = await sql<{ id: number; ip: string; name: string }[]>`
    SELECT vs.id, vs.ip, vs.name
    FROM tarif_vpn_servers tvs
    JOIN vpn_servers vs ON vs.id = tvs.vpn_server_id
    WHERE tvs.tarif_id = ${tarifId} AND vs.is_healthy = TRUE
    ORDER BY RANDOM()
    LIMIT 1
  `;
  const server = rows[0];

  const key = `relaxnet://${crypto.randomBytes(16).toString('hex')}@${server?.ip ?? 'pending'}`;

  if (server) {
    await sql`UPDATE users SET vpn_server_id = ${server.id} WHERE id = ${userId}`;
  }

  return key;
}
