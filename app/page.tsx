// app/page.tsx
// ─────────────────────────────────────────────────────────────────────────
// ГЛАВНАЯ СТРАНИЦА "/"
//
// SEO: canonical НЕ переопределяем — наследуем корневой из app/layout.tsx
// ('https://relaxnet.pro'). Это правильно: главная и есть каноничный корень.
// title тоже НЕ задаём здесь — берётся metadata.title.default из layout,
// чтобы не было двух источников истины для одной страницы.
// Переопределяем ТОЛЬКО openGraph.url (на всякий случай фиксируем корень)
// и description оставляем из layout (он уже про главную).
//
// H1 на странице сформулирован под тот же запрос, что и title в layout,
// но НЕ дословная его копия — точное совпадение title и H1 Google
// расценивает как переспам и переписывает сниппет сам.
// ─────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Только canonical явно — фиксируем, что главная каноникализируется на корень.
  alternates: { canonical: 'https://relaxnet.pro' },
};

export default function LandingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <div className="flex items-center gap-2 mb-16">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-bg font-bold">
          R
        </div>
        <span className="font-medium">RelaxNet</span>
      </div>

      {/* Единственный H1 на странице */}
      <h1 className="text-4xl sm:text-5xl font-medium leading-tight mb-6">
        Один VPN на звонки, мессенджеры и AI<br />
        <span className="text-white/60">и он не отваливается</span>
      </h1>

      <p className="text-white/70 text-lg leading-relaxed mb-10">
        Скорость 100–200 Мбит/с, до 3 устройств на одном аккаунте, конфиги
        всегда под рукой в личном кабинете. Оплата картой в рублях. Скачайте
        клиент, вставьте ключ, подключайтесь.
      </p>

      {/* Воронка: сначала проверить — потом платить */}
      <section
        aria-labelledby="funnel-title"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8 mb-14"
      >
        <p className="text-accent text-xs font-medium uppercase tracking-[0.18em] mb-3">
          Час бесплатно
        </p>
        <h2 id="funnel-title" className="text-2xl sm:text-3xl font-medium mb-3">
          Сначала проверьте — потом платите
        </h2>
        <p className="text-white/70 leading-relaxed mb-7 max-w-xl">
          Мы даём час на том же сервере, что и в платном тарифе. Позвоните в
          Telegram, откройте ChatGPT, замерьте скорость — и решайте сами. Карта
          на этом шаге не нужна.
        </p>

        <ol className="grid gap-4 sm:grid-cols-3 mb-8">
          {[
            { n: '1', label: 'Берёте ключ на час', hint: 'без карты и оплаты' },
            { n: '2', label: 'Проверяете сами', hint: 'звонок, нейросети, скорость' },
            { n: '3', label: 'Платите, если работает', hint: '3 устройства' },
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
            Проверить бесплатно
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg border border-border text-white/80 font-medium text-center transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            Сразу оформить PRO
          </Link>
        </div>

        <p className="text-white/40 text-xs mt-4">
          Вход по коду на почту, пароли не нужны. Оплатите до конца теста — и
          ключ выпускать заново не придётся, он продолжит работать. Один тест
          на аккаунт; по истечении часа ключ отключается сам, списаний не будет.
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-medium mb-4">Оплата — картой любой страны</h2>
        <p className="text-white/70 leading-relaxed">
          Принимаем карты Visa, Mastercard и МИР — российские и зарубежные. Для карт
          РФ оплата в рублях, для остальных — в USD или EUR. Платёж проходит через
          Lava, данные карты обрабатывает провайдер, мы их не храним.
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-medium mb-4">Если IP заблокируют</h2>
        <p className="text-white/70 leading-relaxed">
          Мы следим за состоянием серверов. Если ваш оператор или провайдер
          закроет текущий адрес, в кабинете появится новый ключ, а старый
          пропадёт — заявку писать не нужно, менять настройки вручную тоже.
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-medium mb-4">Почему мы это собрали</h2>
        <p className="text-white/70 leading-relaxed">
          Мы искали инструмент, где работает всё и сразу: и звонки, и
          нейросети, и IDE. Перебрали доступные варианты, разобрались, почему
          одни держат соединение, а другие рвутся, — и собрали свой на самой
          стабильной конфигурации из найденных.{' '}
          <Link
            href="/vpn-dlya-zvonkov"
            className="text-white underline hover:no-underline"
          >
            Подробно о том, как это работает
          </Link>
          .
        </p>
      </section>

      <footer className="mt-24 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-white/40">
        <Link href="/vpn-dlya-zvonkov" className="hover:text-white/70">
          VPN для звонков и нейросетей
        </Link>
        <Link href="/privacy" className="hover:text-white/70">
          Политика конфиденциальности
        </Link>
        <Link href="/terms" className="hover:text-white/70">
          Условия использования
        </Link>
      </footer>
    </main>
  );
}