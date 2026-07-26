'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VpnKeyBlock from './VpnKeyBlock';

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
  vpn_keys?: string[]; // Добавлено для поддержки до 3-х ключей
  tarif_id: number | null;
  tarif_name: string | null;
  card_last4: string | null;
  card_type: string | null;
}

const PLATFORMS = ['Windows', 'macOS', 'iOS', 'Android', 'Linux'] as const;
const MAX_KEYS = 3; // Лимит ключей

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

  // Собираем ключи (если бэк уже отдает массив vpn_keys — берем его, иначе fallback на один vpn_key)
  const userKeys = user.vpn_keys?.length 
    ? user.vpn_keys 
    : (user.vpn_key ? [user.vpn_key] : []);

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
      if (attempts >= 15 && pollRef.current) clearInterval(pollRef.current);
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isActive, searchParams]);

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
      if (data.confirmationUrl || data.paymentUrl) {
        window.location.href = data.confirmationUrl || data.paymentUrl;
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

  // Реальный вызов API
  async function generateNewKey() {
    if (userKeys.length >= MAX_KEYS) return;
    try {
      const res = await fetch('/api/vpn/generate', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Ошибка выпуска ключа');
      
      // Добавляем новый ключ в стейт без перезагрузки
      setUser(prev => ({
        ...prev,
        vpn_keys: [...(prev.vpn_keys || (prev.vpn_key ? [prev.vpn_key] : [])), data.config]
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось выпустить ключ');
    }
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

        {!isActive && (
          <div className="mt-4 space-y-4">
            {tarifs.map((t) => (
              <button
                key={t.id}
                onClick={() => pay(t.id)}
                disabled={payingId === t.id}
                className="w-full py-3 rounded-lg bg-accent text-bg font-medium disabled:opacity-50"
              >
                {payingId === t.id
                  ? 'Переходим к оплате…'
                  : `Оплатить ${t.name} — ${t.priceRub.toFixed(0)} ₽ / ${t.durationDays} дн. · до ${t.maxConnections} устройств`}
              </button>
            ))}
            <p className="text-center text-white/40 text-xs mt-2">Безопасная оплата через Lava.top</p>
          </div>
        )}
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </section>

      {/* Ключи (до 3 штук) */}
      {isActive && userKeys.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Ваши ключи ({userKeys.length} / {MAX_KEYS})</h2>
            {userKeys.length < MAX_KEYS && (
              <button 
                onClick={generateNewKey}
                className="text-sm border border-border hover:border-white/40 text-white px-3 py-1.5 rounded-lg transition"
              >
                + Выпустить ещё
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {userKeys.map((keyConfig, index) => (
              <VpnKeyBlock 
                key={index} 
                config={keyConfig} 
                title={`Ключ устройства ${index + 1}`} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Скачивание клиента + инструкция */}
      <section className="rounded-xl border border-border bg-card p-6 mb-6">
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
          <li>В зависимости от платформы используйте Файл, Ссылку или QR-код из блока выше.</li>
          <li>Подключитесь и пользуйтесь свободным интернетом.</li>
        </ol>
      </section>

      {/* Контакты / Поддержка */}
      <section className="rounded-xl border border-border bg-card p-6 text-sm">
        <h3 className="font-medium mb-2">Остались вопросы?</h3>
        <p className="text-white/60 mb-2">Служба поддержки всегда на связи:</p>
        <ul className="space-y-1">
          <li>
            <span className="text-white/40 mr-2">Telegram:</span>
            <a href="https://t.me/sup_re" target="_blank" className="text-accent hover:underline">@sup_re</a>
          </li>
          <li>
            <span className="text-white/40 mr-2">Email:</span>
            <a href="mailto:support@webbuild.ge" className="text-accent hover:underline">support@webbuild.ge</a>
          </li>
        </ul>
      </section>
    </main>
  );
}