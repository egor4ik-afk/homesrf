'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/profile';
  const next = searchParams.get('next');
  const t = useTranslations('login');
  const nav = useTranslations('nav');

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_fallback'));
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_fallback'));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_fallback'));

      if (next === 'trial') {
        try {
          await fetch('/api/trial/start', { method: 'POST' });
        } catch {
          /* профиль покажет, что пошло не так */
        }
      }

      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_fallback'));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-white/40 text-sm hover:text-white/70">
          {nav('back_home')}
        </Link>

        <h1 className="text-2xl font-medium mt-6 mb-1">{t('h1')}</h1>
        <p className="text-white/50 text-sm mb-8">
          {step === 'email' ? t('step_email_desc') : t('step_code_desc', { email })}
        </p>

        {step === 'email' && (
          <form onSubmit={requestCode} className="space-y-4">
            <input
              type="email"
              required
              autoFocus
              dir="ltr"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-white
                         placeholder:text-white/30 outline-none focus:border-accent"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-accent text-bg font-medium disabled:opacity-50"
            >
              {loading ? t('sending') : t('get_code')}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              required
              autoFocus
              maxLength={6}
              dir="ltr"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-white
                         placeholder:text-white/30 outline-none focus:border-accent
                         tracking-[0.5em] text-center text-xl"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-accent text-bg font-medium disabled:opacity-50"
            >
              {loading ? t('verifying') : t('submit')}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(''); }}
              className="w-full py-2 text-white/40 text-sm hover:text-white/70"
            >
              {t('change_email')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}