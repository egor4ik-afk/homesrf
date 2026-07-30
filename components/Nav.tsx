import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function Nav() {
  const t = useTranslations('nav');

  return (
    <nav aria-label={t('navigation_aria')} className="flex items-center justify-between p-6 max-w-3xl mx-auto">
      <Link href="/" className="flex items-center gap-2 text-white">
        <img src="/favicon.svg" alt="" width={32} height={32} className="rounded-full shrink-0" />
        <span className="text-xl font-bold">{t('brand')}</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-white/80 hover:text-white">{t('home')}</Link>
        <LocaleSwitcher />
      </div>
    </nav>
  );
}