'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VpnKeyBlock from './VpnKeyBlock';
import VpnHelp from '@/components/VpnHelp';
import Link from 'next/link';
import { DOWNLOADS_URL } from '@/lib/constants';

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
  vpn_keys?: { id: number | null; config: string, country: string | null }[];
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
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('Windows');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive =
    user.status === 'active' &&
    user.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  // Собираем ключи (если бэк уже отдает массив vpn_keys — берем его, иначе fallback на один vpn_key)
  const userKeys = user.vpn_keys?.length
    ? user.vpn_keys
    : (user.vpn_key ? [{ id: null, config: user.vpn_key, country: null }] : []);

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

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  async function generateNewKey() {
    if (userKeys.length >= MAX_KEYS || generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/vpn/generate', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Ошибка выпуска ключа');

      setUser(prev => ({
        ...prev,
        vpn_keys: [
          ...(prev.vpn_keys || (prev.vpn_key ? [{ id: null, config: prev.vpn_key, country: null }] : [])),
          { id: data.id ?? null, config: data.config, country: data.country ?? null },
        ],
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось выпустить ключ');
    } finally {
      setGenerating(false);
    }
  }

  function handleKeyDeleted(clientId: number) {
    setUser(prev => ({
      ...prev,
      vpn_keys: (prev.vpn_keys || []).filter(k => k.id !== clientId),
    }));
  }

  const paymentPending = searchParams.get('payment') === 'success' && !isActive;

  return (
    <main className="max-w-2xl mx-auto px-3 py-6 sm:px-6 sm:py-16">
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="min-w-0">
          <p className="text-white/40 text-sm truncate">{user.email}</p>
          <h1 className="text-2xl font-medium">Профиль</h1>
        </div>
        <button onClick={logout} className="shrink-0 text-white/40 text-sm hover:text-white/70">
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
        ) : paymentPending ? (
          <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
            <p className="text-accent text-sm font-medium">Оплата обрабатывается…</p>
            <p className="text-white/70 text-sm mt-1">
              Если вы всё ещё на странице оплаты — нажмите крестик (×) слева сверху,
              чтобы вернуться в RelaxNet. Ключ появится здесь автоматически.
            </p>
          </div>
        ) : (
          <p className="text-white/60 text-sm">Подписка не активна</p>
        )}

        {!isActive && (
          <div className="mt-4 space-y-4">
            {/* Подсказка ДО перехода на оплату — чтобы человек не завис на окне Lava */}
            <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
              <p className="text-white/80 text-sm">
                <span className="text-accent font-medium">Важно:</span> после успешной
                оплаты на странице Lava нажмите крестик (×) слева сверху, чтобы
                вернуться в RelaxNet — ключ появится в профиле автоматически.
              </p>
            </div>

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

      {/* Инструкция подключения — показываем и до оплаты, чтобы человек заранее
          понимал, как всё устроено. Кнопки в блоках ключей появятся после оплаты. */}
      {!isActive && (
        <div className="mb-6">
          <VpnHelp downloadsUrl={DOWNLOADS_URL} />
        </div>
      )}

      {/* Ключи (до 3 штук) — компактный блок над "Скачать клиент" */}
      {isActive && (
        <section className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">Ваши ключи ({userKeys.length} / {MAX_KEYS})</h2>
            {userKeys.length < MAX_KEYS && (
              <button
                onClick={generateNewKey}
                disabled={generating}
                className="text-sm border border-border hover:border-white/40 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {generating ? 'Выпускаем…' : '+ Выпустить ещё'}
              </button>
            )}
          </div>

          <VpnHelp downloadsUrl={DOWNLOADS_URL} />

          <div className="space-y-2">
            {userKeys.length > 0 ? (
              userKeys.map((keyItem, index) => (
                <VpnKeyBlock
                  key={keyItem.id ?? index}
                  config={keyItem.config}
                  clientId={keyItem.id}
                  country={keyItem.country}
                  title={`Ключ устройства ${index + 1}`}
                  onDelete={handleKeyDeleted}
                />
              ))
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-white/60 text-sm mb-4">
                  У вас пока нет ключей. Выпустите первый — он появится здесь и сразу
                  будет готов к подключению.
                </p>
                <button
                  onClick={generateNewKey}
                  disabled={generating}
                  className="px-5 py-2.5 rounded-lg bg-accent text-bg font-medium disabled:opacity-50"
                >
                  {generating ? 'Выпускаем…' : 'Выпустить ключ'}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

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

      <div className="mt-auto pt-6 border-t border-white/10 w-full max-w-md mx-auto text-center pb-8">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">
            Политика конфиденциальности
          </Link>
          <span className="hidden sm:inline text-gray-700">•</span>
          <Link href="/terms" className="hover:text-gray-300 transition-colors">
            Пользовательское соглашение
          </Link>
        </div>
      </div>
    </main>
  );
}