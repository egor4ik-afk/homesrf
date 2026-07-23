'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tarif {
  id: number;
  name: string;
  priceRub: number;
  durationDays: number;
  maxConnections: number;
}

interface UserData {
  id: number;
  email: string;
  status: string;
  subscription_expires_at: string | null;
  vpn_key: string | null;
  tarif_id: number | null;
  tarif_name: string | null;
  card_last4: string | null;
  card_type: string | null;
}

const PLATFORMS = ['Windows', 'macOS', 'iOS', 'Android', 'Linux'] as const;

export default function ProfileClient({
  user: initialUser,
  tarifs,
  downloadsUrl,
}: {
  user: UserData;
  tarifs: Tarif[];
  downloadsUrl: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(initialUser);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [unlinking, setUnlinking] = useState(false);
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('Windows');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive =
    user.status === 'active' &&
    user.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  // после возврата с ?payment=success поллим профиль, пока не обработается вебхук
  useEffect(() => {
    if (searchParams.get('payment') !== 'success' || isActive) return;

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user.status === 'active') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
      if (attempts >= 15 && pollRef.current) clearInterval(pollRef.current); // ~30 сек
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pay(tarifId: number) {
    setError('');
    setPayingId(tarifId);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarifId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось создать платёж');
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setPayingId(null);
    }
  }

  async function unlinkCard() {
    setError('');
    setUnlinking(true);
    try {
      const res = await fetch('/api/payment/unlink-card', { method: 'POST' });
      if (!res.ok) throw new Error('Не удалось отвязать карту');
      setUser((u) => ({ ...u, card_last4: null, card_type: null }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setUnlinking(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-white/40 text-sm">{user.email}</p>
          <h1 className="text-2xl font-medium">Профиль</h1>
        </div>
        <button onClick={logout} className="text-white/40 text-sm hover:text-white/70">
          Выйти
        </button>
      </div>

      {/* Статус подписки */}
      <section className="rounded-xl border border-border bg-card p-6 mb-6">
        {isActive ? (
          <>
            <p className="text-accent text-sm mb-1">Тариф {user.tarif_name} активен</p>
            <p className="text-white/50 text-sm">
              До {new Date(user.subscription_expires_at as string).toLocaleDateString('ru-RU')}
            </p>
          </>
        ) : (
          <p className="text-white/60 text-sm">
            Подписка не активна{searchParams.get('payment') === 'success' ? ' — ждём подтверждения оплаты…' : ''}
          </p>
        )}

        {!isActive &&
          tarifs.map((t) => (
            <button
              key={t.id}
              onClick={() => pay(t.id)}
              disabled={payingId === t.id}
              className="mt-4 w-full py-3 rounded-lg bg-accent text-bg font-medium disabled:opacity-50"
            >
              {payingId === t.id
                ? 'Переходим к оплате…'
                : `Оплатить ${t.name} — ${t.priceRub.toFixed(0)} ₽ / ${t.durationDays} дн. · до ${t.maxConnections} устройств`}
            </button>
          ))}
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </section>

      {/* Ключ */}
      {user.vpn_key && (
        <section className="rounded-xl border border-border bg-card p-6 mb-6">
          <p className="text-white/60 text-sm mb-2">Ваш ключ подключения</p>
          <div className="font-mono text-xs bg-bg border border-border rounded-lg p-3 break-all">
            {user.vpn_key}
          </div>
        </section>
      )}

      {/* Сохранённая карта */}
      {user.card_last4 && (
        <section className="rounded-xl border border-border bg-card p-6 mb-6">
          <p className="text-white/60 text-sm mb-2">Способ оплаты</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {user.card_type || 'Карта'} •••• {user.card_last4}
            </span>
            <button
              onClick={unlinkCard}
              disabled={unlinking}
              className="text-red-400 text-sm hover:text-red-300 disabled:opacity-50"
            >
              {unlinking ? 'Отвязываем…' : 'Отвязать карту'}
            </button>
          </div>
        </section>
      )}

      {/* Скачивание клиента + инструкция */}
      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-white/60 text-sm mb-3">Скачать клиент и подключиться</p>

        {downloadsUrl && (
          <a
            href={downloadsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-2.5 rounded-lg border border-border hover:border-white/40 text-sm mb-5"
          >
            Скачать клиент Amnezia →
          </a>
        )}

        <div className="flex gap-2 mb-3">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-md text-xs ${
                platform === p ? 'bg-accent text-bg' : 'bg-bg text-white/50 border border-border'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <ol className="text-white/60 text-sm space-y-1.5 list-decimal list-inside">
          <li>Установите и откройте клиент Amnezia для {platform}.</li>
          <li>Нажмите «Добавить подключение» → «Вставить ключ».</li>
          <li>Вставьте ключ из письма или из блока выше и нажмите «Подключиться».</li>
        </ol>
      </section>
    </main>
  );
}
