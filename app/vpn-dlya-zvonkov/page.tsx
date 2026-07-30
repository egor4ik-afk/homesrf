import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Бесплатный VPN для звонков в Telegram и WhatsApp — RelaxNet',
  description:
    'RelaxNet: скорость 100–200 Мбит/с, бесперебойный доступ к ChatGPT, Gemini, Claude, Google AI Studio и Antigravity. Автозамена ключа при блокировке IP — без вашего участия.',
  keywords: [
    'бесплатный VPN', 'VPN для звонков телеграм', 'VPN для WhatsApp звонков',
    'VPN для ChatGPT', 'VPN для Gemini', 'VPN для Claude',
    'VPN для Google AI Studio', 'быстрый VPN 200 мбит',
  ],
  alternates: { canonical: 'https://relaxnet.pro/pochemu-relaxnet' },
};

export default function WhyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-white/80 leading-relaxed">
      <h1 className="text-3xl sm:text-4xl font-medium text-white mb-6">
        Почему стоит попробовать именно RelaxNet
      </h1>

      <p className="mb-6">
        Мы сами долго перебирали готовые VPN-сервисы, чтобы всё работало разом:
        звонки в мессенджерах, стабильный доступ к нейросетям, никаких обрывов
        посреди рабочего дня. В итоге собрали свой — протестировали десятки
        вариантов и разобрались, почему одни держат соединение, а другие рвутся.
      </p>

      <h2 className="text-xl font-medium text-white mt-10 mb-3">Что вы получаете</h2>
      <ul className="space-y-2 list-disc pl-5">
        <li>Голосовые и видеозвонки в Telegram, WhatsApp и других мессенджерах — без задержек и обрывов</li>
        <li>Скорость 100–200 Мбит/с на большинстве серверов</li>
        <li>Бесперебойный доступ к ChatGPT, Gemini, Claude</li>
        <li>Работу в Google AI Studio и Antigravity без разрывов сессии</li>
      </ul>

      <h2 className="text-xl font-medium text-white mt-10 mb-3">Наши гарантии</h2>
      <p>
        Если оператор или провайдер заблокирует очередной IP вашего ключа, вам
        не придётся ничего делать вручную: в личном кабинете автоматически
        появится новый ключ, а старый исчезнет. Мы постоянно мониторим здоровье
        серверов и меняем адреса до того, как это станет заметно для вас.
      </p>

      <h2 className="text-xl font-medium text-white mt-10 mb-3">Как это работает</h2>
      <p>
        Вы входите по email, получаете тестовый доступ, проверяете скорость и
        стабильность сами — и только потом решаете, оформлять ли подписку.
      </p>
    </main>
  );
}
