-- Прогнать один раз на уже существующей БД (у вас она уже развёрнута через
-- Adminer/pgAdmin) — добавляет поля под сохранённую карту без DROP/пересоздания.
-- В свежих установках эти поля уже есть в db/schema.sql, эта миграция не нужна.

ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_last4 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_type TEXT;

ALTER TABLE tarifs ADD COLUMN IF NOT EXISTS max_connections INTEGER NOT NULL DEFAULT 1;

UPDATE tarifs SET price_rub = 199.00, max_connections = 3 WHERE name = 'PRO';
