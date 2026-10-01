import crypto from 'crypto';
import sql from './db';
import { Client } from 'ssh2';
import { AWG2_DEFAULT_I1 } from './vpnLink';

export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
  return {
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64'),
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64'),
  };
}

export function generatePsk() {
  return crypto.randomBytes(32).toString('base64');
}

function ipToInt(ip: string) {
  return ip.split('.').reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
}

function intToIp(n: number) {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
}

async function allocateIp(
  serverId: number,
  subnet: string,
  startOffset = 2,
): Promise<string> {
  const [base, bitsRaw] = subnet.split('/');
  const bits = Number(bitsRaw ?? 24);
  const net = ipToInt(base) & (0xffffffff << (32 - bits));
  const size = 2 ** (32 - bits);

  // Уникальность IP теперь обеспечивает ЧАСТИЧНЫЙ индекс
  // vpn_clients_active_ip_uniq (только WHERE revoked_at IS NULL), поэтому
  // IP отозванных ключей можно спокойно переиспользовать — считаем
  // занятыми только активные.
  const rows = await sql<{ allowed_ip: string }[]>`
    SELECT allowed_ip FROM vpn_clients
    WHERE vpn_server_id = ${serverId} AND revoked_at IS NULL
  `;
  const taken = new Set(rows.map((r) => ipToInt(String(r.allowed_ip).split('/')[0])));

  // Первые startOffset адресов пропускаем — они зарезервированы под
  // сам сервер и вручную добавленные/служебные пиры, которых нет в
  // нашей таблице vpn_clients.
  const start = Math.max(2, startOffset);
  for (let i = start; i < size - 1; i++) {
    if (!taken.has(net + i)) return intToIp(net + i);
  }
  throw new Error(`Подсеть ${subnet} на сервере ${serverId} исчерпана`);
}

function sshExec(host: string, command: string): Promise<string> {
  const keyB64 = process.env.VPN_SSH_KEY_B64;
  if (!keyB64) throw new Error('VPN_SSH_KEY_B64 не задан');
  const privateKey = Buffer.from(keyB64, 'base64').toString('utf8');
  const username = process.env.VPN_SSH_USER || 'root';

  return new Promise((resolve, reject) => {
    const conn = new Client();
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      conn.end();
      reject(new Error('ssh timeout'));
    }, 20_000);

    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            conn.end();
            return reject(err);
          }
          stream
            .on('data', (d: Buffer) => chunks.push(d))
            .on('close', (code: number) => {
              clearTimeout(timer);
              conn.end();
              code === 0
                ? resolve(Buffer.concat(chunks).toString())
                : reject(new Error(`ssh exit ${code}: ${Buffer.concat(chunks).toString()}`));
            });
        });
      })
      .on('error', (e) => {
        clearTimeout(timer);
        reject(e);
      })
      .connect({ host, port: 22, username, privateKey, readyTimeout: 10_000 });
  });
}

const B64_RE = /^[A-Za-z0-9+/]{43}=$/;
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const AWG_CONTAINER = 'amnezia-awg2';
const AWG_CONF = '/opt/amnezia/awg/awg0.conf';

async function addPeerOnNode(host: string, pub: string, psk: string, ip: string) {
  if (!B64_RE.test(pub) || !B64_RE.test(psk) || !IP_RE.test(ip)) {
    throw new Error('addPeerOnNode: некорректные параметры');
  }

  // \\n здесь намеренно: в шелл уходит literal \n, который разворачивает printf.
  const cmd = [
    `printf '%s' '${psk}' | docker exec -i ${AWG_CONTAINER} sh -c 'cat > /tmp/psk'`,
    `docker exec ${AWG_CONTAINER} awg set awg0 peer '${pub}' preshared-key /tmp/psk allowed-ips ${ip}/32`,
    `docker exec ${AWG_CONTAINER} rm -f /tmp/psk`,
    `docker exec ${AWG_CONTAINER} sh -c "printf '\\n[Peer]\\nPublicKey = ${pub}\\nPresharedKey = ${psk}\\nAllowedIPs = ${ip}/32\\n' >> ${AWG_CONF}"`,
  ].join(' && ');

  await sshExec(host, cmd);
}

export async function removePeerOnNode(host: string, pub: string) {
  if (!B64_RE.test(pub)) throw new Error('removePeerOnNode: некорректный ключ');
  const escaped = pub.replace(/[+/]/g, '\\$&');

  const cmd = [
    `docker exec ${AWG_CONTAINER} awg set awg0 peer '${pub}' remove`,
    `docker exec ${AWG_CONTAINER} sh -c "awk -v RS= -v ORS='\\n\\n' '!/${escaped}/' ${AWG_CONF} > /tmp/c && mv /tmp/c ${AWG_CONF}"`,
  ].join(' && ');

  await sshExec(host, cmd);
}

interface ServerSettings {
  endpoint: string;
  serverPublicKey: string;
  subnet?: string;
  /** С какого последнего октета начинать выдачу IP. Первые адреса
   *  (сам сервер, ручные/служебные пиры) пропускаются. По умолчанию 2. */
  ipStart?: number;
  dns?: string;
  /** Второй DNS. Если не задан — строка DNS будет из одного адреса. */
  dns2?: string;
  mtu?: number;
  /** Junk-пакет AmneziaWG 2.0. Если у сервера своё значение — положите его
   *  в vpn_server_settings.settings.i1, иначе возьмётся дефолт Amnezia. */
  i1?: string;
  awg: Record<string, string | number>;
}

/** Порядок и состав полей — как в конфигах штатного установщика
 *  AmneziaWG 2.0. Раньше порядок зависел от того, как ключи легли в JSON
 *  настроек сервера, а I1–I5 не писались совсем. */
export function buildClientConfig(
  s: ServerSettings,
  privateKey: string,
  psk: string,
  address: string,
) {
  const awg = s.awg ?? {};
  const p = (key: string, fallback = '') =>
    awg[key] !== undefined ? String(awg[key]) : fallback;

  const dns = s.dns2 ? `${s.dns ?? '1.1.1.1'}, ${s.dns2}` : (s.dns ?? '1.1.1.1');
  const i1 = s.i1 ?? AWG2_DEFAULT_I1;

  return [
    '[Interface]',
    `Address = ${address}/32`,
    `DNS = ${dns}`,
    // В эталонном конфиге строки MTU нет, но без неё клиент берёт 1420
    // и голосовые в Telegram перестают проходить — оставляем явной.
    `MTU = ${s.mtu ?? 1280}`,
    `PrivateKey = ${privateKey}`,
    `Jc = ${p('Jc')}`,
    `Jmin = ${p('Jmin')}`,
    `Jmax = ${p('Jmax')}`,
    `S1 = ${p('S1')}`,
    `S2 = ${p('S2')}`,
    `S3 = ${p('S3')}`,
    `S4 = ${p('S4')}`,
    `H1 = ${p('H1')}`,
    `H2 = ${p('H2')}`,
    `H3 = ${p('H3')}`,
    `H4 = ${p('H4')}`,
    `I1 = ${i1}`,
    'I2 = ',
    'I3 = ',
    'I4 = ',
    'I5 = ',
    '',
    '[Peer]',
    `PublicKey = ${s.serverPublicKey}`,
    `PresharedKey = ${psk}`,
    'AllowedIPs = 0.0.0.0/0, ::/0',
    `Endpoint = ${s.endpoint}`,
    'PersistentKeepalive = 25',
    '',
  ].join('\n');
}

/**
 * Выпускает ключ. serverId — явный выбор ноды; без него берётся случайная
 * публичная нода тарифа, как было раньше.
 *
 * Приватная нода (visibility = 'private') в общую раздачу не попадает
 * никогда: условие owner_user_id = userId отсекает её для всех, кроме
 * владельца, даже если она is_healthy и привязана к тарифу.
 */
export async function issueVpnKey(
  userId: number,
  tarifId: number,
  serverId?: number,
): Promise<{ id: number; configText: string; country: string | null; serverName: string }> {
  const rows = await sql<
    {
      id: number;
      ip: string;
      name: string;
      assign_country: string | null;
      ssh_host: string | null;
      settings: ServerSettings | null;
    }[]
  >`
    SELECT vs.id, vs.ip, vs.name, vs.assign_country, vs.ssh_host, vss.settings
    FROM tarif_vpn_servers tvs
    JOIN vpn_servers vs ON vs.id = tvs.vpn_server_id
    LEFT JOIN vpn_server_settings vss ON vss.vpn_server_id = vs.id
    WHERE tvs.tarif_id = ${tarifId}
      AND vs.is_healthy = TRUE
      AND (vs.visibility = 'public' OR vs.owner_user_id = ${userId})
      AND (${serverId ?? null}::int IS NULL OR vs.id = ${serverId ?? null}::int)
    ORDER BY RANDOM()
    LIMIT 1
  `;
  const server = rows[0];
  if (!server) throw new Error(`Нет живого VPN-сервера для тарифа ${tarifId}`);
  if (!server.ssh_host) throw new Error(`vpn_servers.ssh_host не задан для сервера ${server.id}`);

  const s = server.settings;
  if (!s?.endpoint || !s?.serverPublicKey || !s?.awg) {
    throw new Error(`vpn_server_settings не заполнены для сервера ${server.id} (см. VPN-SETUP.md)`);
  }

  const { publicKey, privateKey } = generateKeyPair();
  const psk = generatePsk();
  const subnet = s.subnet || '10.8.1.0/24';
  const ipStart = s.ipStart ?? 2;

  let address = await allocateIp(server.id, subnet, ipStart);
  let configText = buildClientConfig(s, privateKey, psk, address);

  let clientId = 0;
  for (let attempt = 0; ; attempt++) {
    try {
      const inserted = await sql<{ id: number }[]>`
        INSERT INTO vpn_clients (user_id, vpn_server_id, public_key, private_key, preshared_key, allowed_ip, config_text)
        VALUES (${userId}, ${server.id}, ${publicKey}, ${privateKey}, ${psk}, ${address}, ${configText})
        RETURNING id
      `;
      clientId = inserted[0].id;
      break;
    } catch (e) {
      if (attempt >= 2) throw e;
      address = await allocateIp(server.id, subnet, ipStart);
      // адрес поменялся — конфиг надо пересобрать, иначе в БД ляжет
      // текст со старым Address
      configText = buildClientConfig(s, privateKey, psk, address);
    }
  }

  await addPeerOnNode(server.ssh_host, publicKey, psk, address);

  await sql`UPDATE users SET vpn_server_id = ${server.id} WHERE id = ${userId}`;

  return {
    id: clientId,
    configText,
    country: server.assign_country,
    serverName: server.name,
  };
}

export async function revokeUserKeys(userId: number) {
  const rows = await sql<{ id: number; public_key: string; ssh_host: string | null }[]>`
    SELECT vc.id, vc.public_key, vs.ssh_host
    FROM vpn_clients vc JOIN vpn_servers vs ON vs.id = vc.vpn_server_id
    WHERE vc.user_id = ${userId} AND vc.revoked_at IS NULL
  `;
  for (const r of rows) {
    if (r.ssh_host) await removePeerOnNode(r.ssh_host, r.public_key);
    await sql`UPDATE vpn_clients SET revoked_at = NOW() WHERE id = ${r.id}`;
  }
}