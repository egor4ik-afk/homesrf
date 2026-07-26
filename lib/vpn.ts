import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sql from './db';
import { Client } from 'ssh2';

const execFileAsync = promisify(execFile);

// ... (imports and helper functions remain the same)

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

async function allocateIp(serverId: number, subnet: string): Promise<string> {
  const [base, bitsRaw] = subnet.split('/');
  const bits = Number(bitsRaw ?? 24);
  const net = ipToInt(base) & (0xffffffff << (32 - bits));
  const size = 2 ** (32 - bits);

  const rows = await sql<{ allowed_ip: string }[]>`
    SELECT allowed_ip FROM vpn_clients
    WHERE vpn_server_id = ${serverId} AND revoked_at IS NULL
  `;
  const taken = new Set(rows.map((r) => ipToInt(String(r.allowed_ip).split('/')[0])));

  for (let i = 2; i < size - 1; i++) {
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
    const timer = setTimeout(() => { conn.end(); reject(new Error('ssh timeout')); }, 20_000);

    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) { clearTimeout(timer); conn.end(); return reject(err); }
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
      .on('error', (e) => { clearTimeout(timer); reject(e); })
      .connect({ host, port: 22, username, privateKey, readyTimeout: 10_000 });
  });
}

const B64_RE = /^[A-Za-z0-9+/]{43}=$/;
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

async function addPeerOnNode(host: string, pub: string, psk: string, ip: string) {
  if (!B64_RE.test(pub) || !B64_RE.test(psk) || !IP_RE.test(ip)) {
    throw new Error('addPeerOnNode: некорректные параметры');
  }
  const cmd = [
    `printf '%s' '${psk}' | docker exec -i amnezia-awg2 sh -c 'cat > /tmp/psk'`,
    `docker exec amnezia-awg2 awg set awg0 peer '${pub}' preshared-key /tmp/psk allowed-ips ${ip}/32`,
    `docker exec amnezia-awg2 rm -f /tmp/psk`,
    `docker exec amnezia-awg2 sh -c "printf '\n[Peer]\nPublicKey = ${pub}\nPresharedKey = ${psk}\nAllowedIPs = ${ip}/32\n' >> /opt/amnezia/awg/awg0.conf"`,
  ].join(' && ');
  await sshExec(host, cmd);
}

export async function removePeerOnNode(host: string, pub: string) {
  if (!B64_RE.test(pub)) throw new Error('removePeerOnNode: некорректный ключ');
  const escaped = pub.replace(/[+/]/g, '\\$&');
  const cmd = [
    `docker exec amnezia-awg2 awg set awg0 peer '${pub}' remove`,
    `docker exec amnezian-awg2 sh -c "awk -v RS= -v ORS='\\n\\n' '!/${escaped}/' /opt/amnezia/awg/awg0.conf > /tmp/c && mv /tmp/c /opt/amnezia/awg/awg0.conf"`,
  ].join(' && ');
  await sshExec(host, cmd);
}

interface ServerSettings {
  endpoint: string;
  serverPublicKey: string;
  subnet?: string;
  dns?: string;
  mtu?: number;
  awg: Record<string, string | number>;
}

export function buildClientConfig(s: ServerSettings, privateKey: string, psk: string, address: string) {
  const awgLines = Object.entries(s.awg).map(([k, v]) => `${k} = ${v}`).join('\n');
  return `[Interface]\nPrivateKey = ${privateKey}\nAddress = ${address}/32\nDNS = ${s.dns ?? '1.1.1.1'}\nMTU = ${s.mtu ?? 1280}\n${awgLines}\n\n[Peer]\nPublicKey = ${s.serverPublicKey}\nPresharedKey = ${psk}\nAllowedIPs = 0.0.0.0/0, ::/0\nEndpoint = ${s.endpoint}\nPersistentKeepalive = 25\n`;
}

export async function issueVpnKey(userId: number, tarifId: number): Promise<string> {
  const rows = await sql<
    { id: number; ip: string; name: string; ssh_host: string | null; settings: ServerSettings | null }[]
  >`
    SELECT vs.id, vs.ip, vs.name, vs.ssh_host, vss.settings
    FROM tarif_vpn_servers tvs
    JOIN vpn_servers vs ON vs.id = tvs.vpn_server_id
    LEFT JOIN vpn_server_settings vss ON vss.vpn_server_id = vs.id
    WHERE tvs.tarif_id = ${tarifId} AND vs.is_healthy = TRUE
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

  let address = await allocateIp(server.id, subnet);

  // Сразу генерируем текст конфига, все данные для этого уже есть
  const configText = buildClientConfig(s, privateKey, psk, address);

  for (let attempt = 0; ; attempt++) {
    try {
      await sql`
        INSERT INTO vpn_clients (user_id, vpn_server_id, public_key, private_key, preshared_key, allowed_ip, config_text)
        VALUES (${userId}, ${server.id}, ${publicKey}, ${privateKey}, ${psk}, ${address}, ${configText})
      `;
      break;
    } catch (e) {
      if (attempt >= 2) throw e;
      address = await allocateIp(server.id, subnet);
    }
  }

  await addPeerOnNode(server.ssh_host, publicKey, psk, address);

  await sql`UPDATE users SET vpn_server_id = ${server.id} WHERE id = ${userId}`;

  return configText;
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
