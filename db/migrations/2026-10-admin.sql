-- db/migrations/2026-10-admin.sql
-- Админка + приватные ноды. Идемпотентна, можно прогнать повторно.

-- ─── 1. Админы ────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users SET is_admin = TRUE
WHERE lower(email) IN ('alexrus1144@gmail.com', 'webbuildge@gmail.com');

-- Если кто-то из них ещё не заводился — создаём заготовку, чтобы вход
-- по OTP сразу дал права, а не создал обычного юзера.
INSERT INTO users (email, status, is_admin)
SELECT e, 'inactive', TRUE
FROM (VALUES ('alexrus1144@gmail.com'), ('webbuildge@gmail.com')) AS t(e)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE lower(u.email) = t.e);

-- ─── 2. Видимость нод ─────────────────────────────────────────────────────
-- 'public'  — раздаётся всем по тарифу (как было);
-- 'private' — только owner_user_id, в общую выдачу не попадает.
ALTER TABLE vpn_servers ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE vpn_servers ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id);

ALTER TABLE vpn_servers DROP CONSTRAINT IF EXISTS vpn_servers_visibility_chk;
ALTER TABLE vpn_servers ADD CONSTRAINT vpn_servers_visibility_chk
  CHECK (visibility IN ('public', 'private'));

-- Приватная нода обязана иметь владельца, иначе её не увидит никто.
ALTER TABLE vpn_servers DROP CONSTRAINT IF EXISTS vpn_servers_owner_chk;
ALTER TABLE vpn_servers ADD CONSTRAINT vpn_servers_owner_chk
  CHECK (visibility = 'public' OR owner_user_id IS NOT NULL);

-- ─── 3. Индексы под админские выборки ────────────────────────────────────
CREATE INDEX IF NOT EXISTS users_status_idx   ON users (status);
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
CREATE INDEX IF NOT EXISTS vpn_clients_user_live_idx
  ON vpn_clients (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS payments_status_created_idx ON payments (status, created_at DESC);

-- ─── 4. Журнал админских действий ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit (
  id          SERIAL PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES users(id),
  action      TEXT    NOT NULL,
  target_type TEXT,
  target_id   INTEGER,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit (created_at DESC);

-- ─── 5. Новая нода 38.180.236.101 — приватная, только для владельца ───────
-- ssh_host обязателен: через него lib/vpn.ts ходит добавлять пиры.
-- ВАЖНО: после вставки заполнить vpn_server_settings (см. VPN-SETUP.md),
-- иначе issueVpnKey упадёт с «vpn_server_settings не заполнены».
INSERT INTO vpn_servers (name, ip, ssh_host, assign_country, is_healthy, visibility, owner_user_id)
SELECT 'bg-1', '38.180.236.101', '38.180.236.101', 'BG', FALSE, 'private',
       (SELECT id FROM users WHERE lower(email) = 'webbuildge@gmail.com')
WHERE NOT EXISTS (SELECT 1 FROM vpn_servers WHERE ip = '38.180.236.101');

-- Привязать к тарифу PRO, чтобы нода вообще попадала в выборку issueVpnKey.
INSERT INTO tarif_vpn_servers (tarif_id, vpn_server_id)
SELECT t.id, s.id
FROM tarifs t, vpn_servers s
WHERE t.name = 'PRO' AND s.ip = '38.180.236.101'
  AND NOT EXISTS (
    SELECT 1 FROM tarif_vpn_servers x WHERE x.tarif_id = t.id AND x.vpn_server_id = s.id
  );
