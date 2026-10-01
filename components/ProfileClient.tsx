'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import VpnKeyBlock from './VpnKeyBlock';
import VpnHelp from '@/components/VpnHelp';
import { Link } from '@/i18n/navigation';
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
  trial_expires_at?: string | null;
  vpn_key: string | null;
  vpn_keys?: { id: number | null; config: string; country: string | null }[];
  tarif_id: number | null;
  tarif_name: string | null;
  card_last4: string | null;
  card_type: string | null;
  is_admin?: boolean;
}

const MAX_KEYS = 3;

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
  const t = useTranslations('profile');
  const locale = useLocale();
  const [user, setUser] = useState(initialUser);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive =
    user.status === 'active' &&
    user.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const isTrial =
    user.status === 'trial' &&
    !!user.trial_expires_at &&
    new Date(user.trial_expires_at) > new Date();

  const trialUsed = !!user.trial_expires_at;

  const userKeys = user.vpn_keys?.length
    ? user.vpn_keys
    : user.vpn_key
      ? [{ id: null, config: user.vpn_key, country: null }]
      : [];

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
      if (!res.ok) throw new Error(data.error || t('error_payment'));
      if (data.confirmationUrl || data.paymentUrl) {
        window.location.href = data.confirmationUrl || data.paymentUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_generic'));
      setPayingId(null);
    }
  }

  async function startTrialNow() {
    setError('');
    setTrialLoading(true);
    try {
      const res = await fetch('/api/trial/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_trial'));

      setUser((prev) => ({
        ...prev,
        status: 'trial',
        trial_expires_at: data.expiresAt,
        vpn_keys: [{ id: null, config: data.config, country: null }],
      }));

      setTimeout(() => {
        document.getElementById('vpn-keys')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_generic'));
    } finally {
      setTrialLoading(false);
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
      if (!res.ok) throw new Error(data.error || t('error_generic'));

      setUser((prev) => ({
        ...prev,
        vpn_keys: [
          ...(prev.vpn_keys || (prev.vpn_key ? [{ id: null, config: prev.vpn_key, country: null }] : [])),
          { id: data.id ?? null, config: data.config, country: data.country ?? null },
        ],
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('error_generic'));
    } finally {
      setGenerating(false);
    }
  }

  function handleKeyDeleted(clientId: number) {
    setUser((prev) => ({
      ...prev,
      vpn_keys: (prev.vpn_keys || []).filter((k) => k.id !== clientId),
    }));
  }

  const paymentPending = searchParams.get('payment') === 'success' && !isActive;
  const DATE_LOCALES: Record<string, string> = {
    ru: 'ru-RU',
    en: 'en-US',
    es: 'es-ES',
    zh: 'zh-CN',
    ar: 'ar-SA-u-nu-latn',
  };
  const dateLocale = DATE_LOCALES[locale] ?? 'en-US';

  return (
    <main className="max-w-2xl mx-auto px-3 py-6 sm:px-6 sm:py-16">
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="min-w-0">
          <p className="text-white/40 text-sm truncate" dir="ltr">{user.email}</p>
          <h1 className="text-2xl font-medium">{t('h1')}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {user.is_admin && (
            <Link href="/admin" className="text-white/40 text-sm hover:text-white/70">
              {t('admin_link')}
            </Link>
          )}
          <button onClick={logout} className="text-white/40 text-sm hover:text-white/70">
            {t('logout')}
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 mb-6">
        {isActive ? (
          <>
            <p className="text-accent text-sm mb-1">
              {t('plan_active', { name: user.tarif_name ?? '' })}
            </p>
            <p className="text-white/50 text-sm">
              {t('valid_until', {
                date: new Date(user.subscription_expires_at as string).toLocaleDateString(dateLocale),
              })}
            </p>
          </>
        ) : paymentPending ? (
          <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
            <p className="text-accent text-sm font-medium">{t('payment_processing')}</p>
            <p className="text-white/70 text-sm mt-1">{t('payment_processing_hint')}</p>
          </div>
        ) : isTrial ? (
          <>
            <p className="text-accent text-sm mb-1">{t('trial_active')}</p>
            <p className="text-white/50 text-sm">
              {t('trial_until', {
                time: new Date(user.trial_expires_at as string).toLocaleTimeString(dateLocale, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })}
            </p>
          </>
        ) : (
          <p className="text-white/60 text-sm">{t('no_subscription')}</p>
        )}

        {!isActive && (
          <div className="mt-4 space-y-4">
            {!isTrial && !trialUsed && (
              <button
                onClick={startTrialNow}
                disabled={trialLoading}
                className="w-full py-3 rounded-lg border border-accent text-accent font-medium disabled:opacity-50"
              >
                {trialLoading ? t('trial_issuing') : t('trial_cta')}
              </button>
            )}

            <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
              <p className="text-white/80 text-sm">
                <span className="text-accent font-medium">{t('lava_notice_label')}</span>{' '}
                {t('lava_notice_body')}
              </p>
            </div>

            {tarifs.map((tarif) => (
              <button
                key={tarif.id}
                onClick={() => pay(tarif.id)}
                disabled={payingId === tarif.id}
                className="w-full py-3 rounded-lg bg-accent text-bg font-medium disabled:opacity-50"
              >
                {payingId === tarif.id
                  ? t('pay_processing')
                  : t('pay_button', {
                      name: tarif.name,
                      price: tarif.priceRub.toFixed(0),
                      days: tarif.durationDays,
                      devices: tarif.maxConnections,
                    })}
              </button>
            ))}
            <p className="text-center text-white/40 text-xs mt-2">{t('lava_secure')}</p>
          </div>
        )}
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </section>

      {!isActive && !isTrial && (
        <div className="mb-6">
          <VpnHelp downloadsUrl={DOWNLOADS_URL} />
        </div>
      )}

      {(isActive || isTrial) && (
        <section id="vpn-keys" className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">
              {isTrial ? t('keys_title_trial') : t('keys_title', { count: userKeys.length, max: MAX_KEYS })}
            </h2>
            {isActive && userKeys.length < MAX_KEYS && (
              <button
                onClick={generateNewKey}
                disabled={generating}
                className="text-sm border border-border hover:border-white/40 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {generating ? t('issuing') : t('issue_more')}
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
                  title={t('key_title', { n: index + 1 })}
                  onDelete={handleKeyDeleted}
                />
              ))
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-white/60 text-sm mb-4">{t('no_keys_body')}</p>
                <button
                  onClick={generateNewKey}
                  disabled={generating}
                  className="px-5 py-2.5 rounded-lg bg-accent text-bg font-medium disabled:opacity-50"
                >
                  {generating ? t('issuing') : t('issue_first')}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-6 text-sm">
        <h3 className="font-medium mb-2">{t('support_title')}</h3>
        <p className="text-white/60 mb-2">{t('support_body')}</p>
        <ul className="space-y-1">
          <li>
            <span className="text-white/40 me-2">Telegram:</span>
            <a href="https://t.me/sup_re" target="_blank" className="text-accent hover:underline">
              @sup_re
            </a>
          </li>
          <li>
            <span className="text-white/40 me-2">Email:</span>
            <a href="mailto:support@webbuild.ge" className="text-accent hover:underline">
              support@webbuild.ge
            </a>
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