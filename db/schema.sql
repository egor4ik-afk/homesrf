-- ============================================================
-- RelaxNet — схема БД (общая, к ней позже подключится Gateway)
-- Таблицы tarifs / vpn_servers / tarif_vpn_servers / users —
-- это те же сущности, что на вашей диаграмме, только с явными
-- именами и типами. otp_codes / sessions / payments — то, чего
-- диаграмме не хватало под email+OTP и оплату.
-- ============================================================

CREATE TABLE IF NOT EXISTS tarifs (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,        -- 'STD' | 'PRO'
  price_rub     NUMERIC(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  status        TEXT NOT NULL DEFAULT 'active' -- active | hidden
);

CREATE TABLE IF NOT EXISTS vpn_servers (
  id                 SERIAL PRIMARY KEY,
  ip                 TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  assign_country     TEXT,
  is_healthy         BOOLEAN NOT NULL DEFAULT TRUE,
  last_health_check  TIMESTAMPTZ
);

-- General Settings VPN server — с диаграммы: настройки/правила
-- формирования конфигов, которые нужны серверу в hot reload
CREATE TABLE IF NOT EXISTS vpn_server_settings (
  vpn_server_id INTEGER PRIMARY KEY REFERENCES vpn_servers(id) ON DELETE CASCADE,
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tarif_vpn_servers (
  id            SERIAL PRIMARY KEY,
  tarif_id      INTEGER NOT NULL REFERENCES tarifs(id) ON DELETE CASCADE,
  vpn_server_id INTEGER NOT NULL REFERENCES vpn_servers(id) ON DELETE CASCADE,
  UNIQUE (tarif_id, vpn_server_id)
);

CREATE TABLE IF NOT EXISTS users (
  id                       SERIAL PRIMARY KEY,
  email                    TEXT UNIQUE NOT NULL,
  tarif_id                 INTEGER REFERENCES tarifs(id),
  vpn_server_id            INTEGER REFERENCES vpn_servers(id),
  status                   TEXT NOT NULL DEFAULT 'inactive', -- inactive | active | expired
  subscription_expires_at  TIMESTAMPTZ,
  vpn_key                  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Одноразовые коды для входа по email
CREATE TABLE IF NOT EXISTS otp_codes (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

-- Сессии — токен из httpOnly cookie ищем здесь (без JWT, проще ротировать/отзывать)
CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Платежи через ЮKassa
CREATE TABLE IF NOT EXISTS payments (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id),
  tarif_id              INTEGER NOT NULL REFERENCES tarifs(id),
  amount                NUMERIC(10,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'RUB',
  provider              TEXT NOT NULL DEFAULT 'yookassa',
  provider_payment_id   TEXT UNIQUE,
  status                TEXT NOT NULL DEFAULT 'pending', -- pending | succeeded | canceled
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_payment_id);

-- ============================================================
-- Сид: один тариф PRO включён, STD — заведён, но скрыт (status
-- = 'hidden'), чтобы включить его позже без миграций. Один
-- плейсхолдер VPN-сервера — замените на реальный при разворачивании.
-- ============================================================

INSERT INTO tarifs (name, price_rub, duration_days, status)
VALUES ('PRO', 299.00, 30, 'active')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tarifs (name, price_rub, duration_days, status)
VALUES ('STD', 149.00, 30, 'hidden')
ON CONFLICT (name) DO NOTHING;

INSERT INTO vpn_servers (ip, name, assign_country, is_healthy)
VALUES ('0.0.0.0', 'placeholder-server', 'RU', TRUE)
ON CONFLICT (ip) DO NOTHING;

-- Привязываем PRO к плейсхолдер-серверу, чтобы issueVpnKey() было из чего выбрать
INSERT INTO tarif_vpn_servers (tarif_id, vpn_server_id)
SELECT t.id, vs.id FROM tarifs t, vpn_servers vs
WHERE t.name = 'PRO' AND vs.ip = '0.0.0.0'
ON CONFLICT (tarif_id, vpn_server_id) DO NOTHING;
