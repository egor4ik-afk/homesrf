import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/" className="text-white/40 text-sm hover:text-white/70">← На главную</Link>

      <h1 className="text-2xl font-medium mt-6 mb-2">Политика конфиденциальности</h1>
      <p className="text-white/40 text-sm mb-8">
        Черновик — перед публикацией текст нужно проверить с юристом под конкретную юрисдикцию
        и способ обработки персональных данных (email, платёжные данные через ЮKassa).
      </p>

      <div className="space-y-6 text-white/70 leading-relaxed">
        <section>
          <h2 className="text-white font-medium mb-2">1. Какие данные мы собираем</h2>
          <p>Email для входа и связи, технические данные о подключении к VPN-серверам, данные об оплате (обрабатываются платёжным провайдером ЮKassa — мы не храним данные карт).</p>
        </section>
        <section>
          <h2 className="text-white font-medium mb-2">2. Как используются данные</h2>
          <p>Для авторизации по одноразовому коду, выдачи и доставки VPN-ключа на почту, обработки оплаты и продления подписки.</p>
        </section>
        <section>
          <h2 className="text-white font-medium mb-2">3. Хранение и удаление</h2>
          <p>Данные хранятся до удаления аккаунта. Запрос на удаление — на почту поддержки.</p>
        </section>
      </div>
    </main>
  );
}
