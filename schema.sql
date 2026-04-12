CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS developers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  rating      NUMERIC(2,1) DEFAULT 0,
  logo_url    TEXT,
  website     TEXT,
  contacts    JSONB DEFAULT '{}',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(255) UNIQUE NOT NULL,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  price         BIGINT NOT NULL,
  price_per_sqm INTEGER,
  type          VARCHAR(50) NOT NULL CHECK (type IN ('house','apartment','plot','complex')),
  status        VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active','sold','reserved')),
  area_total    NUMERIC(8,2),
  area_living   NUMERIC(8,2),
  floors        INTEGER,
  rooms         INTEGER,
  address       TEXT,
  district      VARCHAR(100),
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  media_urls    JSONB DEFAULT '[]',
  seo_meta      JSONB DEFAULT '{}',
  developer_id  INTEGER REFERENCES developers(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  phone            VARCHAR(20) NOT NULL,
  email            VARCHAR(255),
  message          TEXT,
  property_id      INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  source_url       TEXT,
  status           VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')),
  utm_source       VARCHAR(100),
  utm_medium       VARCHAR(100),
  utm_campaign     VARCHAR(100),
  telegram_sent    BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  title           VARCHAR(500) NOT NULL,
  content         TEXT,
  excerpt         TEXT,
  cover_image_url TEXT,
  tags            TEXT[] DEFAULT '{}',
  author          VARCHAR(255),
  published_at    TIMESTAMP,
  seo_meta        JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_tracking (
  id           SERIAL PRIMARY KEY,
  lead_id      INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  utm_source   VARCHAR(100),
  utm_medium   VARCHAR(100),
  utm_campaign VARCHAR(100),
  referrer     TEXT,
  clicked_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_type     ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_status   ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price    ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_slug     ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created       ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug       ON articles(slug);
