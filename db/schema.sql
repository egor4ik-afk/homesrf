-- 0001_initial_schema.sql

-- Enum Types
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'plot', 'complex');
CREATE TYPE property_status AS ENUM ('active', 'sold', 'reserved');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'closed');
CREATE TYPE company_label AS ENUM ('cold', 'warm', 'hot');

-- developers Table
CREATE TABLE developers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    rating NUMERIC(2, 1),
    logo_url TEXT,
    contacts JSONB,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- properties Table
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(15, 2),
    price_per_sqm NUMERIC(10, 2),
    type property_type NOT NULL,
    status property_status DEFAULT 'active',
    area_total NUMERIC(8, 2),
    area_living NUMERIC(8, 2),
    floors INT,
    rooms INT,
    address TEXT,
    district VARCHAR(100),
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    media_urls JSONB,
    developer_id INT REFERENCES developers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    seo_meta JSONB
);

-- leads Table
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    message TEXT,
    property_id INT REFERENCES properties(id) ON DELETE SET NULL,
    source_url TEXT,
    status lead_status DEFAULT 'new',
    futyms_id VARCHAR(255),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- articles Table
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    excerpt TEXT,
    tags TEXT[],
    author VARCHAR(100),
    published_at TIMESTAMPTZ,
    cover_image_url TEXT,
    seo_meta JSONB
);

-- companies Table (CRM for partners)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    contacts JSONB,
    notes TEXT,
    label company_label,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- link_tracking Table
CREATE TABLE link_tracking (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    referrer TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_developer_id ON properties(developer_id);
CREATE INDEX idx_developers_slug ON developers(slug);
CREATE INDEX idx_articles_slug ON articles(slug);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
