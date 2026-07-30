import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export const metadata: Metadata = {
  alternates: { canonical: 'https://relaxnet.pro' },
};

export default function LandingPage() {
  const t = useTranslations('home');
  const nav = useTranslations('nav');

  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <div className="flex items-center gap-2 mb-16">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-bg font-bold">
          R
        </div>
        <span className="font-medium">{nav('brand')}</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-medium leading-tight mb-6">
        {t('h1_line1')}
        <br />
        <span className="text-white/60">{t('h1_line2')}</span>
      </h1>

      <p className="text-white/70 text-lg leading-relaxed mb-10">{t('intro')}</p>

      <section
        aria-labelledby="funnel-title"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8 mb-14"
      >
        <p className="text-accent text-xs font-medium uppercase tracking-[0.18em] mb-3">
          {t('funnel_badge')}
        </p>
        <h2 id="funnel-title" className="text-2xl sm:text-3xl font-medium mb-3">
          {t('funnel_title')}
        </h2>
        <p className="text-white/70 leading-relaxed mb-7 max-w-xl">{t('funnel_desc')}</p>

        <ol className="grid gap-4 sm:grid-cols-3 mb-8">
          {[
            { n: '1', label: t('step1_label'), hint: t('step1_hint') },
            { n: '2', label: t('step2_label'), hint: t('step2_hint') },
            { n: '3', label: t('step3_label'), hint: t('step3_hint') },
          ].map((s) => (
            <li key={s.n} className="flex gap-3">
              <span
                aria-hidden
                className="shrink-0 w-6 h-6 rounded-full border border-accent/40 text-accent text-xs flex items-center justify-center mt-0.5"
              >
                {s.n}
              </span>
              <span>
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="block text-sm text-white/50">{s.hint}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login?next=trial"
            className="px-6 py-3 rounded-lg bg-accent text-bg font-medium text-center transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('cta_try')}
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg border border-border text-white/80 font-medium text-center transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            {t('cta_pay')}
          </Link>
        </div>

        <p className="text-white/40 text-xs mt-4">{t('funnel_note')}</p>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-medium mb-4">{t('payment_title')}</h2>
        <p className="text-white/70 leading-relaxed">{t('payment_body')}</p>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-medium mb-4">{t('ip_title')}</h2>
        <p className="text-white/70 leading-relaxed">{t('ip_body')}</p>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-medium mb-4">{t('why_title')}</h2>
        <p className="text-white/70 leading-relaxed">
          {t('why_body')}{' '}
          <Link href="/vpn-dlya-zvonkov" className="text-white underline hover:no-underline">
            {t('why_link')}
          </Link>
          .
        </p>
      </section>

      <footer className="mt-24 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-white/40">
        <Link href="/vpn-dlya-zvonkov" className="hover:text-white/70">
          {t('footer_vpn_link')}
        </Link>
        <Link href="/privacy" className="hover:text-white/70">
          {t('footer_privacy')}
        </Link>
        <Link href="/terms" className="hover:text-white/70">
          {t('footer_terms')}
        </Link>
      </footer>
    </main>
  );
}