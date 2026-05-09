-- Social Sense Database Initialization
-- Creates all tables and indexes for MVP

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis"; -- Requires postgis image, will add later for geographic features

-- ===== CANDIDATES / PERSONAS TABLE =====
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'politician', 'influencer', 'brand'
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_candidates_category ON candidates(category);

-- ===== NEWS ARTICLES TABLE =====
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    source VARCHAR(255),
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW(),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_news_candidate ON news_articles(candidate_id);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_fetched ON news_articles(fetched_at DESC);

-- ===== SENTIMENT SCORES TABLE =====
CREATE TABLE sentiment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    article_id UUID REFERENCES news_articles(id) ON DELETE SET NULL,
    sentiment_score DECIMAL(3, 2), -- -1.00 to 1.00
    confidence DECIMAL(3, 2), -- 0.00 to 1.00
    themes TEXT[], -- Array of detected themes
    region VARCHAR(100), -- 'North', 'Northeast', 'Southeast', 'South', 'Center-West'
    state_code VARCHAR(2), -- 'SP', 'RJ', 'MG', etc
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    volume INTEGER DEFAULT 1, -- Number of mentions
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sentiment_candidate ON sentiment_scores(candidate_id);
CREATE INDEX idx_sentiment_region ON sentiment_scores(region);
CREATE INDEX idx_sentiment_state ON sentiment_scores(state_code);
CREATE INDEX idx_sentiment_created ON sentiment_scores(created_at DESC);

-- ===== REGIONAL SENTIMENT SCORES (Aggregated) =====
CREATE TABLE regional_sentiment_aggregated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    region VARCHAR(100),
    state_code VARCHAR(2),
    state_name VARCHAR(100),
    avg_sentiment DECIMAL(3, 2),
    mention_volume INTEGER DEFAULT 0,
    top_themes TEXT[],
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(candidate_id, state_code)
);

CREATE INDEX idx_regional_agg_candidate ON regional_sentiment_aggregated(candidate_id);
CREATE INDEX idx_regional_agg_state ON regional_sentiment_aggregated(state_code);

-- ===== ALERTS TABLE =====
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    alert_type VARCHAR(50), -- 'sentiment_drop', 'volume_spike', 'coordinated_attack'
    sentiment_change DECIMAL(3, 2),
    threshold_exceeded DECIMAL(3, 2),
    triggered_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_candidate ON alerts(candidate_id);
CREATE INDEX idx_alerts_active ON alerts(is_active);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ===== CHAT CONVERSATIONS TABLE =====
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    user_id VARCHAR(255), -- Could be email or user ID
    messages JSONB, -- Array of {role: 'user'|'assistant', content: string}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_candidate ON chat_conversations(candidate_id);
CREATE INDEX idx_chat_user ON chat_conversations(user_id);

-- ===== API KEYS / SECRETS TABLE =====
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    key_type VARCHAR(50), -- 'newsapi', 'twitter', 'instagram', etc
    key_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP
);

CREATE INDEX idx_api_keys_candidate ON api_keys(candidate_id);
CREATE INDEX idx_api_keys_type ON api_keys(key_type);

-- ===== AUDIT LOG =====
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    action VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_candidate ON audit_logs(candidate_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ===== GRANT PERMISSIONS =====
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ===== INSERT SAMPLE DATA =====
INSERT INTO candidates (name, description, category, url)
VALUES
    ('Lula', 'Brazilian Politician', 'politician', 'https://example.com'),
    ('Bolsonaro', 'Brazilian Politician', 'politician', 'https://example.com'),
    ('Neymar Jr', 'Brazilian Influencer', 'influencer', 'https://instagram.com/neymarjr'),
    ('Natura', 'Brazilian Brand', 'brand', 'https://natura.com.br')
ON CONFLICT DO NOTHING;

-- ===== INSERT REGIONAL SENTIMENT DATA (Mock) =====
-- Geographic sentiment breakdown for Lula across all 27 Brazilian states
INSERT INTO regional_sentiment_aggregated (candidate_id, region, state_code, state_name, avg_sentiment, mention_volume, top_themes, last_updated)
SELECT
    (SELECT id FROM candidates WHERE name = 'Lula' LIMIT 1),
    sentiment_data.region,
    sentiment_data.state_code,
    sentiment_data.state_name,
    sentiment_data.avg_sentiment,
    sentiment_data.mention_volume,
    sentiment_data.top_themes,
    NOW()
FROM (VALUES
    -- Southeast Region (Most positive for Lula)
    ('Southeast', 'SP', 'São Paulo', 0.72, 8420, ARRAY['economia', 'emprego', 'educação']),
    ('Southeast', 'RJ', 'Rio de Janeiro', 0.68, 6890, ARRAY['segurança', 'saúde', 'economia']),
    ('Southeast', 'MG', 'Minas Gerais', 0.55, 5320, ARRAY['agricultura', 'economia', 'educação']),
    ('Southeast', 'ES', 'Espírito Santo', 0.48, 2150, ARRAY['economia', 'turismo', 'educação']),

    -- Northeast Region (Mixed sentiment)
    ('Northeast', 'BA', 'Bahia', -0.31, 4210, ARRAY['segurança', 'saúde', 'educação']),
    ('Northeast', 'PE', 'Pernambuco', 0.22, 3340, ARRAY['educação', 'economia', 'saúde']),
    ('Northeast', 'CE', 'Ceará', 0.18, 3890, ARRAY['turismo', 'economia', 'saúde']),
    ('Northeast', 'MA', 'Maranhão', 0.35, 2560, ARRAY['economia', 'agricultura', 'educação']),
    ('Northeast', 'PB', 'Paraíba', 0.28, 1890, ARRAY['educação', 'saúde', 'economia']),
    ('Northeast', 'RN', 'Rio Grande do Norte', 0.15, 1560, ARRAY['turismo', 'economia', 'saúde']),
    ('Northeast', 'AL', 'Alagoas', 0.12, 1230, ARRAY['educação', 'saúde', 'economia']),
    ('Northeast', 'SE', 'Sergipe', 0.08, 890, ARRAY['economia', 'educação', 'saúde']),
    ('Northeast', 'PI', 'Piauí', 0.25, 1120, ARRAY['agricultura', 'educação', 'economia']),

    -- South Region (More negative for Lula)
    ('South', 'RS', 'Rio Grande do Sul', -0.42, 5670, ARRAY['economia', 'agricultura', 'educação']),
    ('South', 'SC', 'Santa Catarina', -0.28, 3890, ARRAY['economia', 'educação', 'saúde']),
    ('South', 'PR', 'Paraná', -0.15, 4560, ARRAY['agricultura', 'economia', 'educação']),

    -- North Region (Moderate sentiment)
    ('North', 'PA', 'Pará', 0.32, 3120, ARRAY['ambiente', 'economia', 'educação']),
    ('North', 'AM', 'Amazonas', 0.28, 2340, ARRAY['ambiente', 'economia', 'saúde']),
    ('North', 'AC', 'Acre', 0.22, 890, ARRAY['educação', 'ambiente', 'saúde']),
    ('North', 'RO', 'Rondônia', 0.18, 1120, ARRAY['economia', 'agricultura', 'saúde']),
    ('North', 'RR', 'Roraima', 0.15, 650, ARRAY['educação', 'saúde', 'economia']),
    ('North', 'AP', 'Amapá', 0.12, 580, ARRAY['saúde', 'educação', 'economia']),
    ('North', 'TO', 'Tocantins', 0.20, 1230, ARRAY['agricultura', 'economia', 'educação']),

    -- Center-West Region (Moderate to positive)
    ('Center-West', 'DF', 'Distrito Federal', 0.38, 2980, ARRAY['educação', 'saúde', 'economia']),
    ('Center-West', 'MT', 'Mato Grosso', 0.08, 2340, ARRAY['agricultura', 'economia', 'educação']),
    ('Center-West', 'MS', 'Mato Grosso do Sul', 0.12, 1890, ARRAY['agricultura', 'economia', 'saúde']),
    ('Center-West', 'GO', 'Goiás', 0.22, 2670, ARRAY['agricultura', 'economia', 'educação'])
) AS sentiment_data(region, state_code, state_name, avg_sentiment, mention_volume, top_themes)
ON CONFLICT (candidate_id, state_code) DO NOTHING;

COMMIT;
