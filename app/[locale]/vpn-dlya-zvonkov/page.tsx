// app/vpn-dlya-zvonkov/page.tsx
// ─────────────────────────────────────────────────────────────────────────
// СТРАНИЦА "/vpn-dlya-zvonkov" — VPN для звонков и нейросетей
//
// SEO — всё уникально относительно главной:
//   • title       — своя формулировка, шаблон "%s | RelaxNet VPN" из layout
//                   приклеит бренд сам. Итог: "VPN для звонков в Telegram... | RelaxNet VPN"
//   • description  — свой текст, не пересекается с главной
//   • canonical    — АБСОЛЮТНЫЙ полный URL этой страницы (переопределяет
//                   корневой canonical из layout — иначе страница
//                   каноникализировалась бы на главную, это ошибка индексации)
//   • openGraph    — свои title/description/url (иначе унаследует корневые)
//
// JSON-LD: здесь Product+Offer+BreadcrumbList для ЭТОЙ услуги. Он НЕ
// конфликтует с SoftwareApplication из layout — это разные объекты, оба
// валидны, поисковик разберёт каждый отдельно.
// ─────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import type { Metadata } from 'next';

const URL = 'https://relaxnet.pro/vpn-dlya-zvonkov';

export const metadata: Metadata = {
  // Левая часть ≈ 47 симв. + " | RelaxNet VPN" из шаблона ≈ уложится в выдачу
  title: 'VPN для звонков в Telegram и доступа к ChatGPT',
  description:
    'Звонки в Telegram и WhatsApp без обрывов, скорость 100–200 Мбит/с, доступ к ChatGPT, Gemini, Claude и Google AI Studio. Час на проверку до оплаты, оплата в рублях.',

  // Абсолютный canonical этой страницы — обязательно, перекрывает корневой
  alternates: {
    canonical: URL,
    languages: { 'ru-RU': URL },
  },

  openGraph: {
    title: 'VPN для звонков в Telegram и доступа к ChatGPT',
    description:
      'Звонки без обрывов, 100–200 Мбит/с, стабильный доступ к нейросетям. Сначала проверьте час бесплатно — потом платите.',
    url: URL,
    type: 'article',
  },

  twitter: {
    title: 'VPN для звонков в Telegram и доступа к ChatGPT',
    description:
      'Звонки без обрывов, 100–200 Мбит/с, доступ к ChatGPT, Gemini, Claude. Час на проверку бесплатно.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://relaxnet.pro' },
        { '@type': 'ListItem', position: 2, name: 'VPN для звонков и нейросетей', item: URL },
      ],
    },
    {
      '@type': 'Product',
      name: 'RelaxNet PRO',
      description:
        'VPN для звонков в мессенджерах и стабильного доступа к нейросетям. До 3 устройств на аккаунт.',
      brand: { '@type': 'Brand', name: 'RelaxNet' },
      offers: {
        '@type': 'Offer',
        price: '150',
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
        url: URL,
      },
    },
  ],
};

export default function VpnForCallsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Видимые хлебные крошки — должны соответствовать разметке BreadcrumbList */}
      <nav aria-label="Навигация" className="text-sm text-white/40 mb-10">
        <Link href="/" className="hover:text-white/70">
          RelaxNet
        </Link>
        <span className="mx-2 text-white/20">/</span>
        <span className="text-white/60">VPN для звонков и нейросетей</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-medium leading-tight mb-6">
        VPN для звонков в мессенджерах и работы с нейросетями
      </h1>

      <p className="text-white/70 text-lg leading-relaxed mb-12">
        Голосовые и видеозвонки в Telegram и WhatsApp проходят без обрывов,
        ChatGPT, Gemini и Claude открываются с первой попытки, сессия в Google
        AI Studio не отваливается на середине. Скорость на большинстве серверов
        держится в диапазоне 100–200 Мбит/с.
      </p>

      {/* Воронка — тот же оффер, что на главной, но другой заголовок секции */}
      <section
        aria-labelledby="try-title"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8 mb-16"
      >
        <h2 id="try-title" className="text-2xl font-medium mb-3">
          Проверьте на своих задачах — час бесплатно
        </h2>
        <p className="text-white/70 leading-relaxed mb-7">
          Берёте ключ, звоните, открываете нейросети, смотрите скорость. Карта
          не нужна. Работает — оформляете PRO, не работает — просто уходите.
        </p>
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
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">Почему мы собрали свой сервис</h2>
        <p className="text-white/70 leading-relaxed">
          Нам был нужен инструмент, где работает всё и сразу — и звонки, и
          нейросети, и рабочие среды. Мы перебрали доступные варианты, и в
          каждом что-то отваливалось: где-то рвался голос, где-то не
          открывались AI-сервисы. В итоге разобрались, за счёт чего одни
          конфигурации держат соединение, а другие нет, и собрали сервис на
          самой стабильной из проверенных.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">Как это работает технически</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          Под капотом — AmneziaWG: это WireGuard с маскировкой трафика, из-за
          которой соединение не опознаётся как VPN по характерной сигнатуре
          пакетов. Именно поэтому обычный WireGuard в ряде сетей блокируется, а
          этот — продолжает работать.
        </p>
        <p className="text-white/70 leading-relaxed">
          Отдельно подобран MTU: на значении по умолчанию голосовые в Telegram
          перестают проходить, потому что пакеты не влезают в канал и молча
          теряются. Мы выставили меньшее значение — звук перестал рваться. Такие
          детали и есть разница между «VPN работает» и «VPN работает для
          звонков».
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">Что вы получаете</h2>
        <ul className="space-y-3 text-white/70">
          {[
            'Звонки в Telegram, WhatsApp и других мессенджерах без обрывов и задержек',
            'Скорость 100–200 Мбит/с на большинстве серверов',
            'Доступ к ChatGPT, Gemini и Claude',
            'Работу в Google AI Studio и Antigravity без разрывов сессии',
            'До 3 устройств на одном аккаунте, конфиги — в личном кабинете',
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="text-accent">
                —
              </span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">Что будет, если ваш IP заблокируют</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          Блокировки адресов случаются — это нормальная часть работы любого
          VPN, и обещать обратное было бы нечестно. Мы отвечаем за другое: за
          то, что вам не придётся с этим разбираться.
        </p>
        <p className="text-white/70 leading-relaxed">
          Мы регулярно проверяем доступность серверов. Если ваш оператор или
          провайдер закроет текущий адрес, в личном кабинете появится новый
          ключ, а нерабочий пропадёт. Вам останется вставить новый ключ в
          приложение — заявку писать не нужно.
        </p>
      </section>

      <footer className="mt-20 pt-8 border-t border-border flex flex-wrap gap-6 text-sm text-white/40">
        <Link href="/" className="hover:text-white/70">
          На главную
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