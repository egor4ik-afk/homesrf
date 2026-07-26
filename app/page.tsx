import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <div className="flex items-center gap-2 mb-16">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-bg font-bold">R</div>
        <span className="font-medium">RelaxNet</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-medium leading-tight mb-6">
        Быстрый и надёжный VPN
        <br />
        <span className="text-white/60">без лишних настроек</span>
      </h1>
      <p className="text-white/70 text-lg leading-relaxed">
  Один тариф RelaxNet PRO, удобная оплата картой. До 3 конфигов для 3 разных устройств — файлы конфигурации всегда под рукой в вашем личном кабинете. Скачайте, добавьте в приложение и подключайтесь.
</p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-accent text-bg font-medium hover:opacity-90 transition"
        >
          Войти и оформить PRO
        </Link>
      </div>

      <footer className="mt-32 pt-8 border-t border-border flex gap-6 text-sm text-white/40">
        <Link href="/privacy" className="hover:text-white/70">Политика конфиденциальности</Link>
        <Link href="/terms" className="hover:text-white/70">Условия использования</Link>
      </footer>
    </main>
  );
}
