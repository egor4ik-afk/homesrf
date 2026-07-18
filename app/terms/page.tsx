import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/" className="text-white/40 text-sm hover:text-white/70">← На главную</Link>

      <h1 className="text-2xl font-medium mt-6 mb-2">Условия использования</h1>
      <p className="text-white/40 text-sm mb-8">
        Черновик — перед публикацией нужно согласовать с юристом (использование VPN
        законно не во всех юрисдикциях, стоит явно прописать зону ответственности).
      </p>

      <div className="space-y-6 text-white/70 leading-relaxed">
        <section>
          <h2 className="text-white font-medium mb-2">1. Услуга</h2>
          <p>RelaxNet предоставляет доступ к VPN-серверам по подписке PRO. Оплата — картой через ЮKassa, в рублях.</p>
        </section>
        <section>
          <h2 className="text-white font-medium mb-2">2. Ключ доступа</h2>
          <p>Ключ выдаётся после успешной оплаты и высылается на email, указанный при входе. Передача ключа третьим лицам не допускается.</p>
        </section>
        <section>
          <h2 className="text-white font-medium mb-2">3. Возврат средств</h2>
          <p>Условия возврата определяются отдельно и должны соответствовать законодательству РФ о защите прав потребителей.</p>
        </section>
      </div>
    </main>
  );
}
