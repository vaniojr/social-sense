-- Migration: Initial schema
-- Source: scripts/init-db.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);

CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    source VARCHAR(255),
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW(),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_entity ON news_articles(entity_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_fetched ON news_articles(fetched_at DESC);

CREATE TABLE IF NOT EXISTS sentiment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    article_id UUID REFERENCES news_articles(id) ON DELETE SET NULL,
    sentiment_score DECIMAL(3, 2),
    confidence DECIMAL(3, 2),
    themes TEXT[],
    region VARCHAR(100),
    state_code VARCHAR(2),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    volume INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_entity ON sentiment_scores(entity_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_region ON sentiment_scores(region);
CREATE INDEX IF NOT EXISTS idx_sentiment_state ON sentiment_scores(state_code);
CREATE INDEX IF NOT EXISTS idx_sentiment_created ON sentiment_scores(created_at DESC);

CREATE TABLE IF NOT EXISTS regional_sentiment_aggregated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    region VARCHAR(100),
    state_code VARCHAR(2),
    state_name VARCHAR(100),
    avg_sentiment DECIMAL(3, 2),
    mention_volume INTEGER DEFAULT 0,
    top_themes TEXT[],
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(entity_id, state_code)
);

CREATE INDEX IF NOT EXISTS idx_regional_agg_entity ON regional_sentiment_aggregated(entity_id);
CREATE INDEX IF NOT EXISTS idx_regional_agg_state ON regional_sentiment_aggregated(state_code);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20),
    alert_type VARCHAR(50),
    sentiment_change DECIMAL(3, 2),
    threshold_exceeded DECIMAL(3, 2),
    triggered_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_entity ON alerts(entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    messages JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_entity ON chat_conversations(entity_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_conversations(user_id);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    key_type VARCHAR(50),
    key_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_entity ON api_keys(entity_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_type ON api_keys(key_type);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    action VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
