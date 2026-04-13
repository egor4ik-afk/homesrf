'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DISTRICTS = [
  'Центральный', 'Адлер', 'Хоста',
  'Лазаревский', 'Красная Поляна', 'Сириус',
  'Имеретинская низменность',
]

const TYPES = [
  { value: 'house', label: 'Дом / ИЖС' },
  { value: 'apartment', label: 'Квартира' },
  { value: 'plot', label: 'Участок' },
  { value: 'complex', label: 'Жилой комплекс' },
]

const BUDGETS = [
  { value: '5000000', label: 'до 5 млн' },
  { value: '10000000', label: 'до 10 млн' },
  { value: '20000000', label: 'до 20 млн' },
  { value: '50000000', label: 'до 50 млн' },
  { value: '100000000', label: 'до 100 млн' },
]

export default function HomePage() {
  const router = useRouter()
  const [type, setType] = useState('')
  const [district, setDistrict] = useState('')
  const [budget, setBudget] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)

  function handleSearch() {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (district) params.set('district', district)
    if (budget) params.set('price_max', budget)
    router.push(`/catalog?${params.toString()}`)
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>

      {/* HERO — видео */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 560, overflow: 'hidden' }}>
        <video
          autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="https://cdn.relaxdev.ru/homes/1.mp4" type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(27,58,92,0.6)' }} />
        <div style={{
          position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', height: '100%',
          padding: '0 20px', textAlign: 'center', color: '#fff',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#fff', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 'bold', color: '#1B3A5C',
          }}>Х</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.15 }}>
            ХОМС РФ
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', margin: '0 0 36px', opacity: 0.9, maxWidth: 560 }}>
            Хомс найдёт дом для вас где угодно
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/catalog" style={{
              background: '#2D7A4F', color: '#fff', padding: '14px 32px',
              borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none',
            }}>
              Найти дом
            </Link>
            <Link href="/constructor" style={{
              background: 'transparent', color: '#fff', padding: '14px 32px',
              borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none',
              border: '2px solid #fff',
            }}>
              Построить дом
            </Link>
          </div>
        </div>
      </section>

      {/* ПОИСК */}
      <section style={{ background: '#fff', padding: '0 20px' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(27,58,92,0.12)',
          padding: '32px', marginTop: -60, position: 'relative', zIndex: 10,
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 22, color: '#1B3A5C', fontWeight: 700 }}>
            Найдите объект в Сочи
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <select
              value={type} onChange={e => setType(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #dde3ea', fontSize: 15, color: '#1a1a1a' }}
            >
              <option value="">Тип объекта</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={district} onChange={e => setDistrict(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #dde3ea', fontSize: 15, color: '#1a1a1a' }}
            >
              <option value="">Район Сочи</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={budget} onChange={e => setBudget(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid #dde3ea', fontSize: 15, color: '#1a1a1a' }}
            >
              <option value="">Бюджет</option>
              {BUDGETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <button
              onClick={handleSearch}
              style={{
                background: '#1B3A5C', color: '#fff', padding: '12px 24px',
                borderRadius: 8, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
              }}
            >
              🔍 Найти
            </button>
          </div>
        </div>
      </section>

      {/* ПРЕИМУЩЕСТВА */}
      <section style={{ padding: '80px 20px', background: '#F5F5F0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, color: '#1B3A5C', marginBottom: 48 }}>
            Почему ХОМС РФ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔍', title: 'Находим лучшее', text: 'Анализируем рынок Сочи каждый день. Знаем все объекты до их появления в открытом доступе.' },
              { icon: '🏠', title: 'Знаем Сочи', text: 'Работаем на рынке недвижимости Сочи — каждый район, каждая улица знакома нам лично.' },
              { icon: '✅', title: 'До ключей', text: 'Полное сопровождение сделки: от первого звонка до получения ключей и регистрации права.' },
            ].map(item => (
              <div key={item.title} style={{
                background: '#fff', borderRadius: 16, padding: '32px 24px',
                boxShadow: '0 2px 16px rgba(27,58,92,0.06)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1B3A5C', margin: '0 0 12px' }}>{item.title}</h3>
                <p style={{ color: '#555', lineHeight: 1.6, margin: 0, fontSize: 15 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* РАЙОНЫ */}
      <section style={{ padding: '60px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1B3A5C', marginBottom: 32 }}>
            Районы Сочи
          </h2>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {DISTRICTS.map((d, i) => (
              <Link key={d} href={`/catalog?district=${encodeURIComponent(d)}`} style={{
                flexShrink: 0, background: i % 2 === 0 ? '#1B3A5C' : '#2D7A4F',
                color: '#fff', borderRadius: 12, padding: '20px 28px',
                textDecoration: 'none', fontWeight: 700, fontSize: 15,
                minWidth: 160, textAlign: 'center',
              }}>
                {d}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1B3A5C', padding: '80px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>
            Готовы найти свой дом?
          </h2>
          <p style={{ opacity: 0.8, margin: '0 0 36px', fontSize: 16 }}>
            Оставьте заявку — перезвоним в течение 15 минут
          </p>
          {sent ? (
            <div style={{ background: '#2D7A4F', borderRadius: 12, padding: '24px', fontSize: 18, fontWeight: 700 }}>
              ✅ Спасибо! Мы свяжемся с вами в течение 15 минут
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Ваше имя"
                style={{ padding: '14px 18px', borderRadius: 8, border: 'none', fontSize: 16 }}
              />
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
                style={{ padding: '14px 18px', borderRadius: 8, border: 'none', fontSize: 16 }}
              />
              <button
                onClick={() => { if (name && phone) setSent(true) }}
                style={{
                  background: '#2D7A4F', color: '#fff', padding: '16px',
                  borderRadius: 8, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer',
                }}
              >
                Получить консультацию
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ФУТЕР */}
      <footer style={{ background: '#0f2338', color: '#fff', padding: '32px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, opacity: 0.6, fontSize: 14 }}>
          © 2025 ХОМС РФ · homesrf.ru · Недвижимость в Сочи
        </p>
      </footer>

    </div>
  )
}