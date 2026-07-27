// lib/vpnLink.ts
//
// Генератор ссылок vpn://... для AmneziaVPN (контейнер amnezia-awg2,
// AmneziaWG 2.0). Схема снята с настоящей ссылки, выданной клиентом
// Amnezia, и совпадает с ней поле в поле.
//
// Формат: vpn:// + base64url( qCompress( JSON ) ), где qCompress —
// Qt-обёртка над zlib: 4 байта big-endian с размером ИСХОДНЫХ данных,
// затем обычный zlib-поток. Без этого префикса клиент отдаёт error 900.
//
// Важно: строка MTU обязана присутствовать в теле конфига внутри
// last_config.config. Поле last_config.mtu на туннель не влияет — если
// строки в теле нет, приложение берёт дефолтные 1420, UDP начинает
// фрагментироваться и голосовые в Telegram перестают проходить, хотя
// обычный трафик при этом идёт нормально.
//
// Работает и на сервере, и в браузере. Из зависимостей — только pako.

import { deflate } from 'pako';

/** Junk-пакет AmneziaWG 2.0 (подделка под DNS-запрос к icloud.com).
 *  Значение взято из ключа, выданного самим клиентом Amnezia для этого
 *  сервера. Подключение поднимается и с ним, и без него — если сервер
 *  переедет или сменит настройки, передайте своё через opts.i1 либо
 *  отключите его через includeI1: false. */
export const AWG2_DEFAULT_I1 =
  '<r 2><b 0x858000010001000000000669636c6f756403636f6d0000010001c00c000100010000105a00044d583737>';

export interface AmneziaLinkOptions {
  /** Имя подключения в приложении. По умолчанию 'RelaxNet'. */
  description?: string;
  /** Основной DNS. По умолчанию — первый из строки DNS в конфиге. */
  dns1?: string;
  /** Резервный DNS. По умолчанию 1.0.0.1. */
  dns2?: string;
  /** Публичный ключ клиента. Если не передан — выводится из PrivateKey. */
  clientPubKey?: string;
  /** Своё значение I1. */
  i1?: string;
  /** false — не класть junk-пакет в ссылку. По умолчанию true. */
  includeI1?: boolean;
}

/* ------------------------------------------------------------------ */
/* X25519: публичный ключ из приватного, без зависимостей              */
/* ------------------------------------------------------------------ */

const FIELD_P = (1n << 255n) - 19n;

function powMod(base: bigint, exp: bigint): bigint {
  let result = 1n;
  let b = base % FIELD_P;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % FIELD_P;
    b = (b * b) % FIELD_P;
    e >>= 1n;
  }
  return result;
}

/** Умножение базовой точки Curve25519 на скаляр (лестница Монтгомери). */
function derivePublicKey(privateKeyB64: string): string {
  const k = Array.from(base64ToBytes(privateKeyB64));
  if (k.length !== 32) return '';
  k[0] &= 248;
  k[31] &= 127;
  k[31] |= 64;

  let scalar = 0n;
  for (let i = 31; i >= 0; i--) scalar = (scalar << 8n) | BigInt(k[i]);

  const u = 9n;
  let x2 = 1n, z2 = 0n, x3 = u, z3 = 1n, swap = 0n;

  for (let t = 254; t >= 0; t--) {
    const bit = (scalar >> BigInt(t)) & 1n;
    swap ^= bit;
    if (swap) {
      [x2, x3] = [x3, x2];
      [z2, z3] = [z3, z2];
    }
    swap = bit;

    const a = (x2 + z2) % FIELD_P;
    const aa = (a * a) % FIELD_P;
    const b = (x2 - z2 + FIELD_P) % FIELD_P;
    const bb = (b * b) % FIELD_P;
    const e = (aa - bb + FIELD_P) % FIELD_P;
    const c = (x3 + z3) % FIELD_P;
    const d = (x3 - z3 + FIELD_P) % FIELD_P;
    const da = (d * a) % FIELD_P;
    const cb = (c * b) % FIELD_P;

    const s = (da + cb) % FIELD_P;
    x3 = (s * s) % FIELD_P;
    let t2 = (da - cb + FIELD_P) % FIELD_P;
    t2 = (t2 * t2) % FIELD_P;
    z3 = (t2 * u) % FIELD_P;
    x2 = (aa * bb) % FIELD_P;
    z2 = (e * ((aa + 121665n * e) % FIELD_P)) % FIELD_P;
  }

  if (swap) {
    [x2, x3] = [x3, x2];
    [z2, z3] = [z3, z2];
  }

  let result = (x2 * powMod(z2, FIELD_P - 2n)) % FIELD_P;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = Number(result & 255n);
    result >>= 8n;
  }
  return bytesToBase64(out);
}

/* ------------------------------------------------------------------ */
/* base64 / base64url                                                  */
/* ------------------------------------------------------------------ */

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }
  return Buffer.from(bytes).toString('base64');
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/* ------------------------------------------------------------------ */
/* Разбор конфига и сборка ссылки                                      */
/* ------------------------------------------------------------------ */

type Ini = Record<string, Record<string, string>>;

function parseIni(text: string): Ini {
  const out: Ini = {};
  let section = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1);
      out[section] ??= {};
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0 || !section) continue;
    out[section][line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

/** Qt сериализует ключи JSON отсортированными — повторяем, чтобы наша
 *  ссылка была максимально похожа на выданную самим клиентом. */
function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(src).sort().map((k) => [k, sortKeys(src[k])]),
    ) as T;
  }
  return value;
}

/** Qt-совместимое сжатие: [4 байта BE — размер оригинала] + zlib. */
function qCompress(input: Uint8Array): Uint8Array {
  const deflated = deflate(input, { level: 8 });
  const out = new Uint8Array(4 + deflated.length);
  new DataView(out.buffer).setUint32(0, input.length, false);
  out.set(deflated, 4);
  return out;
}

/**
 * Собирает ссылку vpn:// из текста AmneziaWG-конфига — того же самого,
 * что отдаётся файлом.
 */
export function buildAmneziaVpnLink(
  configText: string,
  opts: AmneziaLinkOptions = {},
): string {
  const ini = parseIni(configText);
  const iface = ini['Interface'] ?? {};
  const peer = ini['Peer'] ?? {};

  const endpoint = peer['Endpoint'] ?? '';
  const sep = endpoint.lastIndexOf(':');
  if (sep < 0) throw new Error('buildAmneziaVpnLink: в [Peer] нет корректного Endpoint');
  const hostName = endpoint.slice(0, sep);
  const port = Number(endpoint.slice(sep + 1));
  if (!hostName || !Number.isFinite(port)) {
    throw new Error(`buildAmneziaVpnLink: не разобрал Endpoint "${endpoint}"`);
  }

  const clientIp = (iface['Address'] ?? '').split('/')[0];
  const subnetAddress = clientIp.split('.').slice(0, 3).join('.') + '.0';
  const mtu = String(iface['MTU'] ?? 1280);
  const keepAlive = String(peer['PersistentKeepalive'] ?? 25);
  const allowedIps = (peer['AllowedIPs'] ?? '0.0.0.0/0, ::/0')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const dnsParts = (iface['DNS'] ?? '1.1.1.1').split(',').map((s) => s.trim());
  const dns1 = opts.dns1 ?? dnsParts[0] ?? '1.1.1.1';
  const dns2 = opts.dns2 ?? dnsParts[1] ?? '1.0.0.1';

  const i1 =
    opts.includeI1 === false ? '' : (opts.i1 ?? iface['I1'] ?? AWG2_DEFAULT_I1);

  const clientPrivKey = iface['PrivateKey'] ?? '';
  const clientPubKey =
    opts.clientPubKey ?? (clientPrivKey ? derivePublicKey(clientPrivKey) : '');

  const awgParams: Record<string, string> = {
    H1: iface['H1'] ?? '', H2: iface['H2'] ?? '',
    H3: iface['H3'] ?? '', H4: iface['H4'] ?? '',
    I1: i1, I2: '', I3: '', I4: '', I5: '',
    Jc: iface['Jc'] ?? '', Jmax: iface['Jmax'] ?? '', Jmin: iface['Jmin'] ?? '',
    S1: iface['S1'] ?? '', S2: iface['S2'] ?? '',
    S3: iface['S3'] ?? '', S4: iface['S4'] ?? '',
  };

  // Тело конфига — в том же порядке, в каком его пишет сам клиент,
  // плюс строка MTU (вариант C: без неё рвутся голосовые).
  const body = [
    '[Interface]',
    `Address = ${iface['Address'] ?? ''}`,
    'DNS = $PRIMARY_DNS, $SECONDARY_DNS',
    `MTU = ${mtu}`,
    `PrivateKey = ${clientPrivKey}`,
    `Jc = ${awgParams.Jc}`,
    `Jmin = ${awgParams.Jmin}`,
    `Jmax = ${awgParams.Jmax}`,
    `S1 = ${awgParams.S1}`,
    `S2 = ${awgParams.S2}`,
    `S3 = ${awgParams.S3}`,
    `S4 = ${awgParams.S4}`,
    `H1 = ${awgParams.H1}`,
    `H2 = ${awgParams.H2}`,
    `H3 = ${awgParams.H3}`,
    `H4 = ${awgParams.H4}`,
    `I1 = ${i1}`,
    'I2 = ',
    'I3 = ',
    'I4 = ',
    'I5 = ',
    '',
    '[Peer]',
    `PublicKey = ${peer['PublicKey'] ?? ''}`,
    `PresharedKey = ${peer['PresharedKey'] ?? ''}`,
    `AllowedIPs = ${allowedIps.join(', ')}`,
    `Endpoint = ${endpoint}`,
    `PersistentKeepalive = ${keepAlive}`,
    '',
  ].join('\n');

  const lastConfig = {
    ...awgParams,
    allowed_ips: allowedIps,
    clientId: clientPubKey,
    client_ip: clientIp,
    client_priv_key: clientPrivKey,
    client_pub_key: clientPubKey,
    config: body,
    hostName,
    mtu,
    persistent_keep_alive: keepAlive,
    port, // здесь число
    psk_key: peer['PresharedKey'] ?? '',
    server_pub_key: peer['PublicKey'] ?? '',
  };

  const root = {
    containers: [
      {
        awg: {
          ...awgParams,
          last_config: JSON.stringify(sortKeys(lastConfig)),
          port: String(port), // а здесь строка
          protocol_version: '2',
          subnet_address: subnetAddress,
          transport_proto: 'udp',
        },
        container: 'amnezia-awg2',
      },
    ],
    defaultContainer: 'amnezia-awg2',
    description: opts.description ?? 'RelaxNet',
    dns1,
    dns2,
    hostName,
  };

  const payload = new TextEncoder().encode(JSON.stringify(sortKeys(root)));
  return 'vpn://' + bytesToBase64Url(qCompress(payload));
}