-- Migration: Add Competitor Tracking Tables
-- Source: scripts/001-competitor-tracking.sql

CREATE TABLE IF NOT EXISTS competitor_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_groups_created ON competitor_groups(created_at DESC);

CREATE TABLE IF NOT EXISTS competitor_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES competitor_groups(id) ON DELETE CASCADE NOT NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_competitor_group_members_group ON competitor_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_competitor_group_members_entity ON competitor_group_members(entity_id);
