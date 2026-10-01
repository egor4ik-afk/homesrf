'use client';

// components/AdminClient.tsx
// Три вкладки: сводка, пользователи, ноды. Стиль — как в ProfileClient
// (border-border / bg-card / text-accent), отдельной темы не вводим.

import { useCallback, useEffect, useState } from 'react';

type Tab = 'stats' | 'users' | 'servers';

interface Stats {
  byStatus: { status: string; count: number }[];
  keys: { live: number; revoked: number };
  revenue: { month: string; total: number; count: number }[];
  servers: { id: number; name: string; ip: string; is_healthy: boolean; visibility: string; clients: number }[];
  recentPayments: { email: string; amount: number; status: string; created_at: string }[];
}

interface AdminUserRow {
  id: number;
  email: string;
  status: string;
  is_admin: boolean;
  subscription_expires_at: string | null;
  trial_expires_at: string | null;
  tarif_name: string | null;
  live_keys: number;
  created_at: string;
}

interface ServerRow {
  id: number;
  name: string;
  ip: string;
  ssh_host: string | null;
  assign_country: string | null;
  is_healthy: boolean;
  visibility: string;
  owner_email: string | null;
  live_keys: number;
  has_settings: boolean;
  tarifs: string[];
}

const STATUS_LABEL: Record<string, string> = {
  active: 'активна',
  trial: 'тест',
  expired: 'истекла',
  inactive: 'без подписки',
  expiring: 'гасится (тест)',
  expiring_pro: 'гасится (PRO)',
};

function fmtDate(v: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('ru-RU');
}

export default function AdminClient({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<Tab>('stats');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function call(url: string, init?: RequestInit) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ошибка');
      if (data.note) setNote(data.note);
      return data;
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex items-baseline justify-between gap-4 mb-8">
        <h1 className="text-2xl font-medium">Админка</h1>
        <span className="text-white/40 text-sm truncate" dir="ltr">{adminEmail}</span>
      </header>

      <nav className="flex gap-1 mb-6" aria-label="Разделы админки">
        {([
          ['stats', 'Сводка'],
          ['users', 'Пользователи'],
          ['servers', 'Ноды'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              tab === key ? 'bg-card border border-border text-white' : 'text-white/50 hover:text-white/80'
            }`}
            aria-current={tab === key ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {note && (
        <p className="mb-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
          {note}
        </p>
      )}

      {tab === 'stats' && <StatsTab call={call} />}
      {tab === 'users' && <UsersTab call={call} busy={busy} />}
      {tab === 'servers' && <ServersTab call={call} busy={busy} />}
    </main>
  );
}

// ─────────────────────────────────────────────────────────── Сводка

function StatsTab({ call }: { call: (u: string, i?: RequestInit) => Promise<any> }) {
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    call('/api/admin/stats')
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [call]);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-white/40 text-sm">Загружаем…</p>;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.byStatus.map((s) => (
          <div key={s.status} className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-medium">{s.count}</p>
            <p className="text-white/50 text-sm">{STATUS_LABEL[s.status] ?? s.status}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-medium">{data.keys.live}</p>
          <p className="text-white/50 text-sm">живых ключей</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm text-white/50 mb-3">Выручка по месяцам</h2>
        {data.revenue.length === 0 ? (
          <p className="text-white/40 text-sm">Оплат пока не было.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.revenue.map((r) => (
              <li key={r.month} className="flex justify-between">
                <span className="text-white/60">{r.month}</span>
                <span>{r.total.toLocaleString('ru-RU')} ₽ · {r.count} платежей</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm text-white/50 mb-3">Последние платежи</h2>
        <ul className="space-y-1 text-sm">
          {data.recentPayments.map((p, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="truncate text-white/60" dir="ltr">{p.email}</span>
              <span className="shrink-0">
                {p.amount} ₽ · {p.status} · {fmtDate(p.created_at)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────── Пользователи

function UsersTab({
  call,
  busy,
}: {
  call: (u: string, i?: RequestInit) => Promise<any>;
  busy: boolean;
}) {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    call(`/api/admin/users?${p}`)
      .then((d) => {
        setRows(d.users);
        setTotal(d.total);
      })
      .catch((e) => setErr(e.message));
  }, [call, q, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function act(id: number, body: Record<string, unknown>) {
    try {
      await call(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по email"
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">все статусы</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}
      <p className="text-white/40 text-sm">Найдено: {total}</p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-white/50">
            <tr>
              <th className="px-3 py-2 text-left font-normal">Email</th>
              <th className="px-3 py-2 text-left font-normal">Статус</th>
              <th className="px-3 py-2 text-left font-normal">До</th>
              <th className="px-3 py-2 text-left font-normal">Ключи</th>
              <th className="px-3 py-2 text-left font-normal">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-3 py-2" dir="ltr">
                  {u.email}
                  {u.is_admin && <span className="ml-2 text-accent text-xs">админ</span>}
                </td>
                <td className="px-3 py-2 text-white/60">{STATUS_LABEL[u.status] ?? u.status}</td>
                <td className="px-3 py-2 text-white/60">{fmtDate(u.subscription_expires_at)}</td>
                <td className="px-3 py-2 text-white/60">{u.live_keys}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => act(u.id, { action: 'extend', days: 30 })}
                      className="rounded border border-border px-2 py-1 text-xs hover:border-accent disabled:opacity-40"
                    >
                      +30 дней
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Снять все ключи у ${u.email}? Пиры будут удалены с нод.`)) {
                          act(u.id, { action: 'revoke' });
                        }
                      }}
                      className="rounded border border-border px-2 py-1 text-xs hover:border-red-400 disabled:opacity-40"
                    >
                      Снять ключи
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────── Ноды

function ServersTab({
  call,
  busy,
}: {
  call: (u: string, i?: RequestInit) => Promise<any>;
  busy: boolean;
}) {
  const [rows, setRows] = useState<ServerRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    call('/api/admin/servers')
      .then((d) => setRows(d.servers))
      .catch((e) => setErr(e.message));
  }, [call]);

  useEffect(() => { load(); }, [load]);

  async function act(id: number, body: Record<string, unknown>) {
    try {
      await call(`/api/admin/servers/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  return (
    <div className="space-y-3">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {rows.map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="font-medium">
                {s.name}
                <span className="ml-2 text-white/40 text-sm" dir="ltr">{s.ip}</span>
                {s.assign_country && <span className="ml-2 text-white/40 text-sm">{s.assign_country}</span>}
              </p>
              <p className="text-white/50 text-sm mt-1">
                {s.live_keys} живых ключей
                {s.tarifs.length > 0 && ` · тарифы: ${s.tarifs.join(', ')}`}
                {s.visibility === 'private' && ` · приватная (${s.owner_email ?? 'без владельца'})`}
              </p>
              {!s.has_settings && (
                <p className="text-amber-400 text-sm mt-1">
                  Настройки не заполнены — выдать ключ с этой ноды нельзя.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => act(s.id, { action: 'health', value: !s.is_healthy })}
                className="rounded border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-40"
              >
                {s.is_healthy ? 'Выключить' : 'Включить'}
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  act(s.id, {
                    action: 'visibility',
                    visibility: s.visibility === 'private' ? 'public' : 'private',
                  })
                }
                className="rounded border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-40"
              >
                {s.visibility === 'private' ? 'Открыть всем' : 'Сделать приватной'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
