import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { validateDaysParameter, isValidUUID, isValidStateCode } from './utils/query-validation.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from './middleware/validation-middleware.js';
import {
  CreateEntitySchema,
  UpdateEntitySchema,
  EntityIdParamSchema,
  CreateChatSchema,
  CreateCompetitorGroupSchema,
  FetchNewsSchema,
} from './schemas/validation.js';

dotenv.config();

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const connectionUsesSsl = databaseUrl && !databaseUrl.includes('localhost');

// Initialize Claude API client
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Database connection pool
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: connectionUsesSsl ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'socialsense',
    });

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...corsOrigins,
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database constraints on startup
async function initializeDatabase() {
  try {
    await pool.query(`
      ALTER TABLE news_articles
      ADD CONSTRAINT unique_news_url UNIQUE (url)
    `);
    console.log('✅ Added UNIQUE constraint to news_articles.url');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('✅ UNIQUE constraint already exists on news_articles.url');
    } else {
      console.warn('⚠️  Could not add constraint:', err.message);
    }
  }

  // Add settings columns to entities table
  try {
    await pool.query(`
      ALTER TABLE entities
      ADD COLUMN priority_regions TEXT[] DEFAULT '{}',
      ADD COLUMN alert_preferences JSONB DEFAULT '{"sentiment_drop": true, "critical_sentiment": true, "high_volume": true}'
    `);
    console.log('✅ Added settings columns to entities table');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('✅ Settings columns already exist on entities table');
    } else {
      console.warn('⚠️  Could not add settings columns:', err.message);
    }
  }

  // Create entity_keywords table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entity_keywords (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(entity_id, keyword)
      )
    `);
    console.log('✅ Created entity_keywords table');
  } catch (err: any) {
    console.warn('⚠️  Could not create entity_keywords table:', err.message);
  }

  // Create competitor tracking tables
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS competitor_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_competitor_groups_created ON competitor_groups(created_at DESC);
    `);
    console.log('✅ Created competitor_groups table');
  } catch (err: any) {
    console.warn('⚠️  Could not create competitor_groups table:', err.message);
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS competitor_group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES competitor_groups(id) ON DELETE CASCADE NOT NULL,
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, entity_id)
      );
      CREATE INDEX IF NOT EXISTS idx_competitor_group_members_group ON competitor_group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_competitor_group_members_entity ON competitor_group_members(entity_id);
    `);
    console.log('✅ Created competitor_group_members table');
  } catch (err: any) {
    console.warn('⚠️  Could not create competitor_group_members table:', err.message);
  }

  // Create trend detection tables
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sentiment_trends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sentiment_trends_entity ON sentiment_trends(entity_id);
      CREATE INDEX IF NOT EXISTS idx_sentiment_trends_created ON sentiment_trends(created_at DESC);
    `);
    console.log('✅ Created sentiment_trends table');
  } catch (err: any) {
    console.warn('⚠️  Could not create sentiment_trends table:', err.message);
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trend_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        detected_at TIMESTAMP DEFAULT NOW(),
        is_dismissed BOOLEAN DEFAULT FALSE
      );
      CREATE INDEX IF NOT EXISTS idx_trend_alerts_entity ON trend_alerts(entity_id);
      CREATE INDEX IF NOT EXISTS idx_trend_alerts_severity ON trend_alerts(severity);
    `);
    console.log('✅ Created trend_alerts table');
  } catch (err: any) {
    console.warn('⚠️  Could not create trend_alerts table:', err.message);
  }

  // Enhance chat_conversations table
  try {
    await pool.query(`
      ALTER TABLE chat_conversations
      ADD COLUMN title VARCHAR(255),
      ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
      ADD COLUMN tags TEXT[] DEFAULT '{}',
      ADD COLUMN metadata JSONB DEFAULT '{}'
    `);
    console.log('✅ Enhanced chat_conversations table');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('✅ Chat table enhancement already applied');
    } else {
      console.warn('⚠️  Could not enhance chat_conversations table:', err.message);
    }
  }

  // Create chat_follow_ups table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        sources TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_chat_follow_ups_conversation ON chat_follow_ups(conversation_id);
    `);
    console.log('✅ Created chat_follow_ups table');
  } catch (err: any) {
    console.warn('⚠️  Could not create chat_follow_ups table:', err.message);
  }

  // Create chat_snippets table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_snippets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
        snippet_text TEXT NOT NULL,
        message_context TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_chat_snippets_conversation ON chat_snippets(conversation_id);
    `);
    console.log('✅ Created chat_snippets table');
  } catch (err: any) {
    console.warn('⚠️  Could not create chat_snippets table:', err.message);
  }

  // Create chat_exports table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_exports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
        format VARCHAR(20) NOT NULL,
        file_path VARCHAR(500),
        download_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_chat_exports_conversation ON chat_exports(conversation_id);
    `);
    console.log('✅ Created chat_exports table');
  } catch (err: any) {
    console.warn('⚠️  Could not create chat_exports table:', err.message);
  }

  // Create real-time events table (Bloco I)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS real_time_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        is_acknowledged BOOLEAN DEFAULT FALSE
      );
      CREATE INDEX IF NOT EXISTS idx_real_time_events_entity ON real_time_events(entity_id);
      CREATE INDEX IF NOT EXISTS idx_real_time_events_created ON real_time_events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_real_time_events_severity ON real_time_events(severity);
    `);
    console.log('✅ Created real_time_events table');
  } catch (err: any) {
    console.warn('⚠️  Could not create real_time_events table:', err.message);
  }

  // Create system metrics table (Bloco K)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL NOT NULL,
        dimension JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_system_metrics_entity ON system_metrics(entity_id);
      CREATE INDEX IF NOT EXISTS idx_system_metrics_created ON system_metrics(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
    `);
    console.log('✅ Created system_metrics table');
  } catch (err: any) {
    console.warn('⚠️  Could not create system_metrics table:', err.message);
  }

  // Create action recommendations table (Bloco L)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS action_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
        recommendation_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        suggested_action TEXT,
        impact_score DECIMAL,
        confidence_score DECIMAL,
        status VARCHAR(20) DEFAULT 'active',
        is_acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_recommendations_entity ON action_recommendations(entity_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON action_recommendations(priority);
      CREATE INDEX IF NOT EXISTS idx_recommendations_created ON action_recommendations(created_at DESC);
    `);
    console.log('✅ Created action_recommendations table');
  } catch (err: any) {
    console.warn('⚠️  Could not create action_recommendations table:', err.message);
  }
}

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      timestamp: new Date(),
      database: 'connected',
      query_time: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Entities endpoints
app.get('/api/entities', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM entities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
});

app.get('/api/entities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM entities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching entity:', error);
    res.status(500).json({ error: 'Failed to fetch entity' });
  }
});

app.post('/api/entities', validateBody(CreateEntitySchema), async (req: Request, res: Response) => {
  try {
    const { name, description, type, url } = req.body;
    const result = await pool.query(
      'INSERT INTO entities (name, description, type, url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, type, url],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: 'Failed to create entity' });
  }
});

// GET /api/entities/:id/config - Get entity configuration with keywords and alert preferences
app.get('/api/entities/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM entities WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    const entity = result.rows[0];

    // Get keywords for this entity
    const keywordsResult = await pool.query(
      'SELECT keyword FROM entity_keywords WHERE entity_id = $1 ORDER BY keyword',
      [id]
    ).catch(() => ({ rows: [] })); // Return empty if table doesn't exist yet

    const keywords = keywordsResult.rows.map((r: any) => r.keyword);

    res.json({
      ...entity,
      keywords,
      priority_regions: entity.priority_regions || [],
      alert_preferences: entity.alert_preferences || {
        sentiment_drop: true,
        critical_sentiment: true,
        high_volume: true,
      },
    });
  } catch (error) {
    console.error('Error fetching entity config:', error);
    res.status(500).json({ error: 'Failed to fetch entity config' });
  }
});

// PUT /api/entities/:id - Update entity and preferences
app.put('/api/entities/:id', validateParams(EntityIdParamSchema), validateBody(UpdateEntitySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, type, url, priority_regions, alert_preferences } = req.body;

    const result = await pool.query(
      'UPDATE entities SET name = $1, description = $2, type = $3, url = $4, priority_regions = $5, alert_preferences = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [name, description, type, url, JSON.stringify(priority_regions || []), JSON.stringify(alert_preferences || {}), id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    console.log(`✅ Updated entity: ${name}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ error: 'Failed to update entity' });
  }
});

// DELETE /api/entities/:id - Delete entity
app.delete('/api/entities/:id', validateParams(EntityIdParamSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM entities WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    console.log(`🗑️ Deleted entity: ${result.rows[0].name}`);
    res.json({ deleted: true, entity: result.rows[0] });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: 'Failed to delete entity' });
  }
});

// POST /api/entities/:id/keywords - Add keyword
app.post('/api/entities/:id/keywords', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { keyword } = req.body;

    if (!keyword) {
      res.status(400).json({ error: 'keyword required' });
      return;
    }

    // Create keywords table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entity_keywords (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(entity_id, keyword)
      )
    `);

    // Check keyword count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM entity_keywords WHERE entity_id = $1',
      [id]
    );

    if (parseInt(countResult.rows[0].count) >= 100) {
      res.status(400).json({ error: 'Maximum 100 keywords per entity' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO entity_keywords (entity_id, keyword) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [id, keyword]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Keyword already exists' });
      return;
    }

    console.log(`✅ Added keyword "${keyword}" to entity ${id}`);
    res.status(201).json({ keyword, created_at: result.rows[0].created_at });
  } catch (error) {
    console.error('Error adding keyword:', error);
    res.status(500).json({ error: 'Failed to add keyword' });
  }
});

// DELETE /api/entities/:id/keywords/:keyword - Remove keyword
app.delete('/api/entities/:id/keywords/:keyword', async (req: Request, res: Response) => {
  try {
    const { id, keyword } = req.params;
    const decodedKeyword = decodeURIComponent(keyword);

    const result = await pool.query(
      'DELETE FROM entity_keywords WHERE entity_id = $1 AND keyword = $2',
      [id, decodedKeyword]
    );

    console.log(`✅ Removed keyword "${decodedKeyword}" from entity ${id}`);
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error removing keyword:', error);
    res.status(500).json({ error: 'Failed to remove keyword' });
  }
});

// ===== COMPETITOR TRACKING ENDPOINTS =====

// POST /api/competitor-groups - Create competitor group
app.post('/api/competitor-groups', validateBody(CreateCompetitorGroupSchema), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const result = await pool.query(
      'INSERT INTO competitor_groups (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );

    console.log(`✅ Created competitor group: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating competitor group:', error);
    res.status(500).json({ error: 'Failed to create competitor group' });
  }
});

// GET /api/competitor-groups - List all competitor groups
app.get('/api/competitor-groups', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM competitor_groups ORDER BY created_at DESC'
    );

    // Get member count for each group
    const groupsWithMembers = await Promise.all(
      result.rows.map(async (group: any) => {
        const memberResult = await pool.query(
          'SELECT COUNT(*) as member_count FROM competitor_group_members WHERE group_id = $1',
          [group.id]
        );
        return {
          ...group,
          member_count: parseInt(memberResult.rows[0].member_count),
        };
      })
    );

    res.json(groupsWithMembers);
  } catch (error) {
    console.error('❌ Error fetching competitor groups:', error);
    res.status(500).json({ error: 'Failed to fetch competitor groups' });
  }
});

// GET /api/competitor-groups/:id - Get group with members
app.get('/api/competitor-groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get group
    const groupResult = await pool.query(
      'SELECT * FROM competitor_groups WHERE id = $1',
      [id]
    );

    if (groupResult.rows.length === 0) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Get members
    const membersResult = await pool.query(`
      SELECT e.id, e.name, e.type, cgm.added_at
      FROM competitor_group_members cgm
      JOIN entities e ON e.id = cgm.entity_id
      WHERE cgm.group_id = $1
      ORDER BY cgm.added_at DESC
    `, [id]);

    res.json({
      ...groupResult.rows[0],
      members: membersResult.rows,
    });
  } catch (error) {
    console.error('❌ Error fetching competitor group:', error);
    res.status(500).json({ error: 'Failed to fetch competitor group' });
  }
});

// PUT /api/competitor-groups/:id - Update group
app.put('/api/competitor-groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await pool.query(
      'UPDATE competitor_groups SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    console.log(`✅ Updated competitor group: ${name}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating competitor group:', error);
    res.status(500).json({ error: 'Failed to update competitor group' });
  }
});

// DELETE /api/competitor-groups/:id - Delete group
app.delete('/api/competitor-groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM competitor_groups WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    console.log(`✅ Deleted competitor group`);
    res.json({ deleted: true });
  } catch (error) {
    console.error('❌ Error deleting competitor group:', error);
    res.status(500).json({ error: 'Failed to delete competitor group' });
  }
});

// POST /api/competitor-groups/:id/members - Add entity to group
app.post('/api/competitor-groups/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { entityId } = req.body;

    if (!entityId) {
      res.status(400).json({ error: 'entityId required' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO competitor_group_members (group_id, entity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [id, entityId]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Member already exists in group' });
      return;
    }

    console.log(`✅ Added member to competitor group`);
    res.status(201).json({ id: result.rows[0].id, entity_id: entityId });
  } catch (error) {
    console.error('❌ Error adding group member:', error);
    res.status(500).json({ error: 'Failed to add group member' });
  }
});

// DELETE /api/competitor-groups/:id/members/:entityId - Remove entity from group
app.delete('/api/competitor-groups/:id/members/:entityId', async (req: Request, res: Response) => {
  try {
    const { id, entityId } = req.params;

    const result = await pool.query(
      'DELETE FROM competitor_group_members WHERE group_id = $1 AND entity_id = $2 RETURNING *',
      [id, entityId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Member not found in group' });
      return;
    }

    console.log(`✅ Removed member from competitor group`);
    res.json({ deleted: true });
  } catch (error) {
    console.error('❌ Error removing group member:', error);
    res.status(500).json({ error: 'Failed to remove group member' });
  }
});

// GET /api/competitors/sentiment-comparison - Compare sentiment across entities
app.get('/api/competitors/sentiment-comparison', async (req: Request, res: Response) => {
  try {
    const groupIdParam = req.query.groupId as string;
    const daysParam = (req.query.days as string) || '7';
    const entityIdsParam = req.query.entityIds as string;

    let entityIds: string[] = [];

    if (groupIdParam) {
      // Get entities from group
      const result = await pool.query(
        'SELECT entity_id FROM competitor_group_members WHERE group_id = $1',
        [groupIdParam]
      );
      entityIds = result.rows.map((r: any) => r.entity_id);
    } else if (entityIdsParam) {
      // Use provided entity IDs
      entityIds = entityIdsParam.split(',');
    } else {
      res.status(400).json({ error: 'groupId or entityIds required' });
      return;
    }

    if (entityIds.length === 0) {
      res.status(400).json({ error: 'No entities found' });
      return;
    }

    // Get comparison data for each entity
    const comparison: any = {};
    const timelineMap: any = {};

    for (const entityId of entityIds) {
      const validatedDays = validateDaysParameter(daysParam);
      const result = await pool.query(`
        SELECT
          AVG(ss.sentiment_score) as avg_sentiment,
          COUNT(*) as mention_volume,
          ss.state_code
        FROM sentiment_scores ss
        WHERE ss.entity_id = $1
          AND ss.created_at > NOW() - INTERVAL '1 day' * $2
        GROUP BY ss.state_code
      `, [entityId, validatedDays]);

      const entityData = result.rows;
      const avgSentiment = entityData.reduce((sum: number, row: any) => sum + parseFloat(row.avg_sentiment || 0), 0) / Math.max(entityData.length, 1);
      const totalVolume = entityData.reduce((sum: number, row: any) => sum + parseInt(row.mention_volume), 0);

      comparison[entityId] = {
        current_sentiment: parseFloat(avgSentiment.toFixed(2)),
        mention_volume: totalVolume,
        top_regions: entityData.slice(0, 3).map((row: any) => ({
          state: row.state_code,
          sentiment: parseFloat(row.avg_sentiment || 0),
        })),
      };

      // Build timeline
      const timelineResult = await pool.query(`
        SELECT
          DATE(ss.created_at) as date,
          AVG(ss.sentiment_score) as sentiment
        FROM sentiment_scores ss
        WHERE ss.entity_id = $1
          AND ss.created_at > NOW() - INTERVAL '1 day' * $2
        GROUP BY DATE(ss.created_at)
        ORDER BY DATE(ss.created_at)
      `, [entityId, validatedDays]);

      timelineResult.rows.forEach((row: any) => {
        const date = row.date;
        if (!timelineMap[date]) {
          timelineMap[date] = { date };
        }
        timelineMap[date][entityId] = parseFloat(row.sentiment);
      });
    }

    const timeline = Object.values(timelineMap);

    console.log(`📊 Competitor comparison: ${entityIds.length} entities`);
    res.json({ comparison, timeline });
  } catch (error) {
    console.error('❌ Error fetching sentiment comparison:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment comparison' });
  }
});

// GET /api/competitors/market-share - Get market share (mention volume distribution)
app.get('/api/competitors/market-share', async (req: Request, res: Response) => {
  try {
    const groupIdParam = req.query.groupId as string;

    if (!groupIdParam) {
      res.status(400).json({ error: 'groupId required' });
      return;
    }

    // Get entities from group
    const groupResult = await pool.query(
      'SELECT entity_id FROM competitor_group_members WHERE group_id = $1',
      [groupIdParam]
    );

    const entityIds = groupResult.rows.map((r: any) => r.entity_id);

    if (entityIds.length === 0) {
      res.status(404).json({ error: 'No entities in group' });
      return;
    }

    // Get mention volume for each entity
    const marketShare = await Promise.all(
      entityIds.map(async (entityId: string) => {
        const volResult = await pool.query(
          'SELECT COUNT(*) as volume FROM sentiment_scores WHERE entity_id = $1',
          [entityId]
        );

        const entityResult = await pool.query(
          'SELECT name FROM entities WHERE id = $1',
          [entityId]
        );

        return {
          entity_id: entityId,
          name: entityResult.rows[0]?.name || 'Unknown',
          volume: parseInt(volResult.rows[0].volume),
        };
      })
    );

    const totalVolume = marketShare.reduce((sum: number, item: any) => sum + item.volume, 0);

    const withPercentage = marketShare.map((item: any) => ({
      ...item,
      percentage: totalVolume > 0 ? parseFloat(((item.volume / totalVolume) * 100).toFixed(2)) : 0,
    }));

    console.log(`📊 Market share calculated for ${entityIds.length} competitors`);
    res.json({ market_share: withPercentage, total_volume: totalVolume });
  } catch (error) {
    console.error('❌ Error fetching market share:', error);
    res.status(500).json({ error: 'Failed to fetch market share' });
  }
});

// GET /api/competitors/head-to-head - Head-to-head comparison between 2 entities
app.get('/api/competitors/head-to-head', async (req: Request, res: Response) => {
  try {
    const entity1Param = req.query.entityId1 as string;
    const entity2Param = req.query.entityId2 as string;

    if (!entity1Param || !entity2Param) {
      res.status(400).json({ error: 'entityId1 and entityId2 required' });
      return;
    }

    // Get sentiment by region for both entities
    const result1 = await pool.query(`
      SELECT state_code, AVG(sentiment_score) as sentiment
      FROM sentiment_scores
      WHERE entity_id = $1
      GROUP BY state_code
    `, [entity1Param]);

    const result2 = await pool.query(`
      SELECT state_code, AVG(sentiment_score) as sentiment
      FROM sentiment_scores
      WHERE entity_id = $1
      GROUP BY state_code
    `, [entity2Param]);

    const map1: any = {};
    const map2: any = {};

    result1.rows.forEach((row: any) => {
      map1[row.state_code] = parseFloat(row.sentiment);
    });

    result2.rows.forEach((row: any) => {
      map2[row.state_code] = parseFloat(row.sentiment);
    });

    const stronger_in = Object.keys(map1).filter((state: string) => map1[state] > (map2[state] || 0));
    const weaker_in = Object.keys(map1).filter((state: string) => map1[state] < (map2[state] || 0));
    const neutral = Object.keys(map1).filter((state: string) => Math.abs((map1[state] || 0) - (map2[state] || 0)) <= 0.1);

    console.log(`⚔️  Head-to-head comparison completed`);
    res.json({
      entity1_id: entity1Param,
      entity2_id: entity2Param,
      stronger_in,
      weaker_in,
      neutral,
    });
  } catch (error) {
    console.error('❌ Error fetching head-to-head comparison:', error);
    res.status(500).json({ error: 'Failed to fetch head-to-head comparison' });
  }
});

// ===== TREND DETECTION ENDPOINTS =====
import * as trendAnalysis from './utils/trend-analysis.js';

// GET /api/trends/timeline - Timeline with sentiment, volume, and anomalies
app.get('/api/trends/timeline', async (req: Request, res: Response) => {
  try {
    const { entity_id, days = '30' } = req.query;
    const daysParam = parseInt(days as string) || 30;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    // Get daily sentiment and volume
    const validatedDays = validateDaysParameter(daysParam);
    const result = await pool.query(`
      SELECT
        DATE(ss.created_at) as date,
        AVG(ss.sentiment_score) as sentiment_avg,
        COUNT(*) as volume,
        array_agg(DISTINCT rs.state_code ORDER BY rs.state_code) FILTER (WHERE ss.sentiment_score > 0.3) as regions_positive,
        array_agg(DISTINCT rs.state_code ORDER BY rs.state_code) FILTER (WHERE ss.sentiment_score < -0.3) as regions_negative
      FROM sentiment_scores ss
      LEFT JOIN regional_sentiment_aggregated rs ON rs.state_code IS NOT NULL
      WHERE ss.entity_id = $1
        AND ss.created_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY DATE(ss.created_at)
      ORDER BY DATE(ss.created_at)
    `, [entity_id, validatedDays]);

    const timeline: trendAnalysis.TimelinePoint[] = result.rows.map((row: any) => ({
      date: row.date,
      sentiment_avg: parseFloat(row.sentiment_avg || 0),
      sentiment_change_pct: 0,
      volume: parseInt(row.volume),
      regions_positive: row.regions_positive || [],
      regions_negative: row.regions_negative || [],
    }));

    // Calculate percent change
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1].sentiment_avg;
      const curr = timeline[i].sentiment_avg;
      timeline[i].sentiment_change_pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
    }

    const report = trendAnalysis.generateTimelineReport(timeline);

    console.log(`📈 Timeline generated for ${daysParam} days: ${timeline.length} data points`);
    res.json(report);
  } catch (error) {
    console.error('❌ Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// GET /api/trends/anomalies - Detect anomalies
app.get('/api/trends/anomalies', async (req: Request, res: Response) => {
  try {
    const { entity_id, sensitivity = '2.5' } = req.query;
    const sensParam = parseFloat(sensitivity as string) || 2.5;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    // Get timeline for anomaly detection
    const result = await pool.query(`
      SELECT
        DATE(ss.created_at) as date,
        AVG(ss.sentiment_score) as sentiment_avg,
        COUNT(*) as volume
      FROM sentiment_scores ss
      WHERE ss.entity_id = $1
        AND ss.created_at > NOW() - INTERVAL '90 days'
      GROUP BY DATE(ss.created_at)
      ORDER BY DATE(ss.created_at)
    `, [entity_id]);

    const timeline: trendAnalysis.TimelinePoint[] = result.rows.map((row: any) => ({
      date: row.date,
      sentiment_avg: parseFloat(row.sentiment_avg || 0),
      sentiment_change_pct: 0,
      volume: parseInt(row.volume),
      regions_positive: [],
      regions_negative: [],
    }));

    const anomalies = trendAnalysis.detectAnomalies(timeline, sensParam);

    console.log(`🚨 Detected ${anomalies.length} anomalies`);
    res.json({ anomalies });
  } catch (error) {
    console.error('❌ Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// GET /api/trends/theme-evolution - Track theme evolution
app.get('/api/trends/theme-evolution', async (req: Request, res: Response) => {
  try {
    const { entity_id, days = '30' } = req.query;
    const daysParam = parseInt(days as string) || 30;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    // Get themes by date
    const validatedDays = validateDaysParameter(daysParam);
    const result = await pool.query(`
      SELECT
        DATE(ss.created_at) as date,
        unnest(ss.themes) as theme,
        AVG(ss.sentiment_score) as sentiment
      FROM sentiment_scores ss
      WHERE ss.entity_id = $1
        AND ss.created_at > NOW() - INTERVAL '1 day' * $2
        AND ss.themes IS NOT NULL
      GROUP BY DATE(ss.created_at), theme
      ORDER BY DATE(ss.created_at)
    `, [entity_id, validatedDays]);

    const themeMap: { [key: string]: trendAnalysis.ThemeEvolution } = {};

    result.rows.forEach((row: any) => {
      const themeName = row.theme;
      if (!themeMap[themeName]) {
        themeMap[themeName] = {
          name: themeName,
          volume_timeline: [],
          sentiment_timeline: [],
          trend: 'stable',
          first_appeared: row.date,
        };
      }
      themeMap[themeName].volume_timeline.push({ date: row.date, volume: 1 });
      themeMap[themeName].sentiment_timeline.push({ date: row.date, sentiment: parseFloat(row.sentiment) });
    });

    // Calculate trend direction
    const themes = Object.values(themeMap).map(theme => {
      const volumes = theme.volume_timeline.map(v => v.volume);
      const trend = volumes.length > 1 && volumes[volumes.length - 1] > volumes[0] ? 'rising' : 'falling';
      return { ...theme, trend };
    });

    console.log(`🎨 Theme evolution: ${themes.length} themes tracked`);
    res.json({ themes });
  } catch (error) {
    console.error('❌ Error fetching theme evolution:', error);
    res.status(500).json({ error: 'Failed to fetch theme evolution' });
  }
});

// POST /api/trends/alerts/:id/dismiss - Dismiss a trend alert
app.post('/api/trends/alerts/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE trend_alerts SET is_dismissed = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    console.log(`✅ Alert ${id} dismissed`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

app.get('/api/geo/regional-sentiment', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.query;

    let query: string;
    const params: (string | undefined)[] = [];

    if (entityId) {
      query = `
        WITH latest_sentiment AS (
          SELECT
            rsa.*,
            e.name as entity_name,
            ROW_NUMBER() OVER (PARTITION BY rsa.entity_id, rsa.state_code ORDER BY rsa.last_updated DESC) as rn
          FROM regional_sentiment_aggregated rsa
          JOIN entities e ON e.id = rsa.entity_id
          WHERE rsa.entity_id = $1
        )
        SELECT
          state_code,
          state_name,
          region,
          avg_sentiment,
          mention_volume,
          top_themes,
          last_updated,
          entity_name
        FROM latest_sentiment
        WHERE rn = 1
        ORDER BY avg_sentiment DESC
      `;
      params.push(entityId as string);
    } else {
      query = `
        WITH latest_sentiment AS (
          SELECT
            rsa.*,
            ROW_NUMBER() OVER (PARTITION BY rsa.entity_id, rsa.state_code ORDER BY rsa.last_updated DESC) as rn
          FROM regional_sentiment_aggregated rsa
        )
        SELECT
          state_code,
          state_name,
          region,
          avg_sentiment,
          mention_volume,
          top_themes,
          last_updated
        FROM latest_sentiment
        WHERE rn = 1
        ORDER BY avg_sentiment DESC
      `;
    }

    const result = await pool.query(query, params);

    // Calculate statistics - filter out NaN values
    const states = result.rows.filter((s: any) => {
      const sentiment = typeof s.avg_sentiment === 'string' ? parseFloat(s.avg_sentiment) : s.avg_sentiment;
      return !isNaN(sentiment) && sentiment !== null;
    });

    const sentiments = states.map((s: any) => typeof s.avg_sentiment === 'string' ? parseFloat(s.avg_sentiment) : s.avg_sentiment);
    const bestState = states.length > 0 ? states[0] : null;
    const worstState = states.length > 0 ? states[states.length - 1] : null;
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length
      : null;

    console.log(`📊 Regional sentiment: ${states.length} states, avg=${avgSentiment}`);

    res.json({
      states,
      total_states: states.length,
      statistics: {
        best_state: bestState,
        worst_state: worstState,
        average_sentiment: avgSentiment !== null ? Math.round(avgSentiment * 100) / 100 : null,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching regional sentiment:', error);
    res.status(500).json({ error: 'Failed to fetch regional sentiment' });
  }
});

// Sentiment endpoints (placeholder)
app.get('/api/sentiment/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const result = await pool.query(
      `SELECT region, state_code, AVG(sentiment_score) as avg_sentiment, COUNT(*) as volume
       FROM sentiment_scores
       WHERE entity_id = $1
       GROUP BY region, state_code
       ORDER BY avg_sentiment DESC`,
      [entityId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment' });
  }
});

// News Aggregation endpoints
// Helper function for 2-stage sentiment analysis with validation and retry
async function analyzeSentiment(article: any, entity: any): Promise<{ sentiment_score: number; themes: string[]; region: string | null }> {
  const defaultResult = { sentiment_score: 0, themes: [], region: null };

  try {
    // Stage 1: Identify sentiment direction (positive/negative/neutral) using chain-of-thought
    const stage1Prompt = `Você é especialista em análise de sentimento para mídia brasileira.

TAREFA: Identificar se esta notícia é POSITIVA, NEGATIVA ou NEUTRA em relação a ${entity.name}.

Título: ${article.title}
Descrição: ${article.description || ''}

EXEMPLOS DE REFERÊNCIA:
1. "Neymar eleito Melhor Jogador do Ano" → POSITIVO (elogio, reconhecimento)
2. "Robinho Jr. acusa Neymar de agressão" → NEGATIVO (acusação, escândalo)
3. "Neymar marca 2 gols em vitória do Brasil" → POSITIVO (sucesso, conquista)
4. "Bolsonaro propõe novo programa social" → POSITIVO (se fala bem do programa)
5. "Lula mantém isolamento após teste positivo para COVID" → NEGATIVO (saúde, crise)
6. "São Paulo abre novas vagas de emprego" → NEUTRO (informação factual)

PENSE PASSO A PASSO:
- Há palavras-chave negativas? (acusa, denúncia, escândalo, crítica, problema, morte, conflito)
- Há palavras-chave positivas? (elogia, sucesso, vitória, conquista, apoio, crescimento)
- É apenas informação factual? (sem julgamento claro)

RESPONDA APENAS COM:
SENTIMENTO: POSITIVO | NEGATIVO | NEUTRO`;

    const stage1Response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [{ role: 'user', content: stage1Prompt }],
    });

    const stage1Text = stage1Response.content[0].type === 'text' ? stage1Response.content[0].text : '';
    console.log(`📍 Stage 1 response: ${stage1Text}`);

    // Extract sentiment direction
    const directionMatch = stage1Text.match(/SENTIMENTO:\s*(POSITIVO|NEGATIVO|NEUTRO)/i);
    const direction = directionMatch ? directionMatch[1].toUpperCase() : 'NEUTRO';

    // Stage 2: Quantify intensity and extract themes/region
    const stage2Prompt = `Você é especialista em análise de sentimento para mídia brasileira.

CONTEXTO: Analisar o sentimento de uma notícia em relação a ${entity.name}
SENTIMENTO IDENTIFICADO NO PASSO ANTERIOR: ${direction}

Título: ${article.title}
Descrição: ${article.description || ''}

INSTRUÇÃO CRÍTICA: Use a ESCALA COMPLETA de -1.0 a 1.0, não apenas valores intermediários.

TABELA DE REFERÊNCIA:
┌─────────────────────────────────────────────────────────────────┐
│ ESCALA COMPLETA DE SENTIMENTO (use TODO o intervalo)            │
├─────────────────────────────────────────────────────────────────┤
│ MUITO NEGATIVO (-1.0 a -0.7):                                    │
│   -1.0 = Acusação gravíssima, crime, corrupção desmascarada     │
│   -0.9 = Escândalo maior, crise existencial                     │
│   -0.8 = Crítica severa, problema grave documentado             │
│   -0.7 = Problema significativo, falha importante               │
│                                                                   │
│ NEGATIVO (-0.6 a -0.3):                                          │
│   -0.6 = Crítica moderada-forte                                  │
│   -0.5 = Crítica moderada, questão adversa                      │
│   -0.4 = Crítica leve, aspecto negativo                         │
│   -0.3 = Ligeiramente negativo                                   │
│                                                                   │
│ NEUTRO (approx 0.0):                                             │
│    0.0 = Informação factual, sem julgamento claro               │
│                                                                   │
│ POSITIVO (0.3 a 0.6):                                            │
│    0.3 = Ligeiramente positivo, notícia favorável               │
│    0.4 = Elogio leve, aspecto positivo                          │
│    0.5 = Elogio moderado, sucesso ou progresso                 │
│    0.6 = Elogio moderado-forte                                  │
│                                                                   │
│ MUITO POSITIVO (0.7 a 1.0):                                      │
│    0.7 = Grande sucesso, conquista importante                   │
│    0.8 = Vitória significativa, grande elogio                   │
│    0.9 = Aclamação máxima, reconhecimento excepcional           │
│    1.0 = Vitória esmagadora, apoteose                           │
└─────────────────────────────────────────────────────────────────┘

ANÁLISE:
1. Qual é a INTENSIDADE emocional da notícia?
2. Qual é o contexto político/social?
3. Qual é o impacto para a reputação de ${entity.name}?

Tema detectado (máx 3): política, economia, saúde, educação, segurança, ambiente, esporte, corrupção, justiça, cultura
Estado/Região mencionado: SP, RJ, MG, BA, PE, CE, SC, RS, ou null

RETORNE JSON VÁLIDO (SEM MARKDOWN, SEM EXPLICAÇÃO):
{"sentiment_score": <float entre -1.0 e 1.0>, "themes": ["tema1"], "region": null}`;

    const stage2Response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: stage2Prompt }],
    });

    const stage2Text = stage2Response.content[0].type === 'text' ? stage2Response.content[0].text : '{}';
    console.log(`📝 Stage 2 RAW response: [${stage2Text}]`);

    const analysis = JSON.parse(stage2Text);
    console.log(`✅ Stage 2 Parsed:`, JSON.stringify(analysis));

    // Validate response
    if (
      typeof analysis.sentiment_score === 'number' &&
      Array.isArray(analysis.themes) &&
      (typeof analysis.region === 'string' || analysis.region === null)
    ) {
      return {
        sentiment_score: Math.max(-1, Math.min(1, analysis.sentiment_score)), // Clamp to [-1, 1]
        themes: analysis.themes.slice(0, 5), // Max 5 themes
        region: analysis.region,
      };
    }

    console.warn('⚠️  Invalid analysis response, retrying with simpler prompt...');
    throw new Error('Invalid fields in response');
  } catch (error) {
    console.error(`⚠️  Sentiment analysis failed: ${(error as Error).message}, using keyword fallback`);

    // Fallback: simple keyword detection
    const text = `${article.title} ${article.description}`.toLowerCase();
    const negativeKeywords = ['acusa', 'denúncia', 'escândalo', 'crítica', 'problema', 'morte', 'conflito', 'agressão', 'roubo', 'corrupção'];
    const positiveKeywords = ['elogia', 'sucesso', 'vitória', 'conquista', 'apoio', 'crescimento', 'melhor', 'premiado'];

    let sentiment = 0;
    if (negativeKeywords.some(k => text.includes(k))) sentiment = -0.5;
    else if (positiveKeywords.some(k => text.includes(k))) sentiment = 0.5;

    return {
      sentiment_score: sentiment,
      themes: [],
      region: null,
    };
  }
}

// Helper function to generate alerts based on sentiment
async function generateAlerts(entityId: string, pool: Pool) {
  try {
    const avgResult = await pool.query(`
      SELECT AVG(ss.sentiment_score) as avg_score, COUNT(*) as total
      FROM sentiment_scores ss
      WHERE ss.entity_id = $1
        AND ss.created_at > NOW() - INTERVAL '24 hours'
    `, [entityId]);

    const avg = parseFloat(avgResult.rows[0]?.avg_score || '0');
    const total = parseInt(avgResult.rows[0]?.total || '0');

    if (total > 0 && avg < -0.4) {
      await pool.query(`
        INSERT INTO alerts (entity_id, title, description, severity, alert_type, sentiment_change, triggered_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT DO NOTHING
      `, [entityId,
          'Sentimento crítico detectado',
          `Sentimento médio das últimas 24h: ${avg.toFixed(2)} (abaixo de -0.40)`,
          'critical',
          'sentiment_drop',
          avg]);
    } else if (total > 0 && avg < -0.2) {
      await pool.query(`
        INSERT INTO alerts (entity_id, title, description, severity, alert_type, sentiment_change, triggered_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT DO NOTHING
      `, [entityId,
          'Sentimento em queda',
          `Sentimento médio das últimas 24h: ${avg.toFixed(2)}`,
          'medium',
          'sentiment_drop',
          avg]);
    }
  } catch (error) {
    console.error('Error generating alerts:', error);
  }
}

// Helper function to aggregate regional sentiment data
async function aggregateRegionalSentiment(entityId: string, pool: Pool) {
  try {
    console.log(`🗺️ Aggregating regional sentiment for entity ${entityId}...`);

    // Delete old aggregated data for this entity to prevent duplicates
    await pool.query(
      'DELETE FROM regional_sentiment_aggregated WHERE entity_id = $1',
      [entityId]
    );

    // Define Brazilian states with their regions
    const stateMap: { [key: string]: { region: string; state_name: string } } = {
      'SP': { region: 'Southeast', state_name: 'São Paulo' },
      'RJ': { region: 'Southeast', state_name: 'Rio de Janeiro' },
      'MG': { region: 'Southeast', state_name: 'Minas Gerais' },
      'ES': { region: 'Southeast', state_name: 'Espírito Santo' },
      'BA': { region: 'Northeast', state_name: 'Bahia' },
      'PE': { region: 'Northeast', state_name: 'Pernambuco' },
      'CE': { region: 'Northeast', state_name: 'Ceará' },
      'MA': { region: 'Northeast', state_name: 'Maranhão' },
      'PB': { region: 'Northeast', state_name: 'Paraíba' },
      'RN': { region: 'Northeast', state_name: 'Rio Grande do Norte' },
      'AL': { region: 'Northeast', state_name: 'Alagoas' },
      'SE': { region: 'Northeast', state_name: 'Sergipe' },
      'PI': { region: 'Northeast', state_name: 'Piauí' },
      'RS': { region: 'South', state_name: 'Rio Grande do Sul' },
      'SC': { region: 'South', state_name: 'Santa Catarina' },
      'PR': { region: 'South', state_name: 'Paraná' },
      'PA': { region: 'North', state_name: 'Pará' },
      'AM': { region: 'North', state_name: 'Amazonas' },
      'AC': { region: 'North', state_name: 'Acre' },
      'RO': { region: 'North', state_name: 'Rondônia' },
      'RR': { region: 'North', state_name: 'Roraima' },
      'AP': { region: 'North', state_name: 'Amapá' },
      'TO': { region: 'North', state_name: 'Tocantins' },
      'DF': { region: 'Center-West', state_name: 'Distrito Federal' },
      'MT': { region: 'Center-West', state_name: 'Mato Grosso' },
      'MS': { region: 'Center-West', state_name: 'Mato Grosso do Sul' },
      'GO': { region: 'Center-West', state_name: 'Goiás' },
    };

    // Get aggregated sentiment by state (group NULL state_code as national)
    const aggregationQuery = `
      SELECT
        COALESCE(ss.state_code, 'NATIONAL') as state_code,
        AVG(CAST(ss.sentiment_score AS NUMERIC)) as avg_sentiment,
        COUNT(*) as mention_volume,
        ARRAY[]::TEXT[] as top_themes
      FROM sentiment_scores ss
      WHERE ss.entity_id = $1
      GROUP BY COALESCE(ss.state_code, 'NATIONAL')
    `;

    const aggregationResult = await pool.query(aggregationQuery, [entityId]);
    console.log(`📊 Found ${aggregationResult.rows.length} state groups to aggregate`);

    // Update regional_sentiment_aggregated table
    for (const row of aggregationResult.rows) {
      const stateCode = row.state_code;
      const stateInfo = stateMap[stateCode] || { region: 'National', state_name: 'Brasil' };

      console.log(`  📍 ${stateCode}: sentiment=${row.avg_sentiment}, volume=${row.mention_volume}`);

      await pool.query(`
        INSERT INTO regional_sentiment_aggregated (entity_id, region, state_code, state_name, avg_sentiment, mention_volume, top_themes, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        entityId,
        stateInfo.region,
        stateCode === 'NATIONAL' ? null : stateCode,
        stateInfo.state_name,
        Math.round(parseFloat(row.avg_sentiment) * 100) / 100, // Round to 2 decimals
        row.mention_volume,
        row.top_themes || []
      ]);
    }

    console.log(`✅ Regional sentiment aggregation complete`);
  } catch (error) {
    console.error('Error aggregating regional sentiment:', error);
  }
}


// GET /api/news - Retrieve news articles from database
app.get('/api/news', async (req: Request, res: Response) => {
  try {
    const { entity_id, limit = '50', days = '7' } = req.query;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    const result = await pool.query(`
      SELECT
        na.id, na.title, na.description, na.source,
        na.url, na.published_at, na.content,
        ss.sentiment_score, ss.themes, ss.state_code, ss.region
      FROM news_articles na
      LEFT JOIN sentiment_scores ss ON ss.article_id = na.id
      WHERE na.entity_id = $1
        AND na.published_at > NOW() - INTERVAL '${parseInt(days as string)} days'
      ORDER BY na.published_at DESC
      LIMIT $2
    `, [entity_id, parseInt(limit as string)]);

    console.log(`📰 Retrieved ${result.rows.length} news articles`);
    res.json({ articles: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /api/news/filtered - Retrieve news with advanced filtering
app.get('/api/news/filtered', validateQuery(FetchNewsSchema), async (req: Request, res: Response) => {
  try {
    const entityIdParam = (req.query.entity_id as unknown as string) || '';
    const limitParam = (req.query.limit as unknown as string) || '50';
    const daysParam = ((req.query.days as unknown as number) || 7) as number;
    const sentimentParam = req.query.sentiment as unknown as string;
    const sourceParam = req.query.source as unknown as string;
    const regionParam = req.query.region as unknown as string;
    const offsetParam = (req.query.offset as unknown as string) || '0';

    if (!entityIdParam) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    const validatedDays = daysParam;
    let query = `
      SELECT
        na.id, na.title, na.description, na.source,
        na.url, na.published_at, na.content,
        ss.sentiment_score, ss.themes, ss.state_code, ss.region
      FROM news_articles na
      LEFT JOIN sentiment_scores ss ON ss.article_id = na.id
      WHERE na.entity_id = $1
        AND na.published_at > NOW() - INTERVAL '1 day' * $2
    `;

    const params: (string | number)[] = [entityIdParam, validatedDays];
    let paramIndex = 3;

    // Add sentiment filter
    if (sentimentParam && sentimentParam !== 'all') {
      if (sentimentParam === 'positive') {
        query += ` AND ss.sentiment_score > 0.2`;
      } else if (sentimentParam === 'negative') {
        query += ` AND ss.sentiment_score < -0.2`;
      } else if (sentimentParam === 'neutral') {
        query += ` AND ss.sentiment_score BETWEEN -0.2 AND 0.2`;
      }
    }

    // Add source filter
    if (sourceParam && sourceParam !== 'all') {
      query += ` AND na.source = $${paramIndex}`;
      params[paramIndex - 1] = sourceParam;
      paramIndex++;
    }

    // Add region filter
    if (regionParam && regionParam !== 'all') {
      query += ` AND ss.state_code = $${paramIndex}`;
      params[paramIndex - 1] = regionParam;
      paramIndex++;
    }

    query += ` ORDER BY na.published_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params[paramIndex - 1] = parseInt(limitParam);
    params[paramIndex] = parseInt(offsetParam);

    const result = await pool.query(query, params);

    console.log(`📰 Retrieved ${result.rows.length} filtered news articles`);
    res.json({ articles: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('❌ Error fetching filtered news:', error);
    res.status(500).json({ error: 'Failed to fetch filtered news' });
  }
});

// POST /api/news/fetch - Fetch news from NewsAPI and save to database
app.post('/api/news/fetch', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.body;

    if (!entityId) {
      res.status(400).json({ error: 'entityId required' });
      return;
    }

    // 1. Get entity data
    const entityResult = await pool.query(
      'SELECT name, type FROM entities WHERE id = $1',
      [entityId]
    );

    if (entityResult.rows.length === 0) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    const entity = entityResult.rows[0];
    console.log(`📰 Fetching news for ${entity.name}...`);

    // 2. Call NewsAPI
    const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: `"${entity.name}"`,
        language: 'pt',
        sortBy: 'publishedAt',
        pageSize: 20,
        apiKey: process.env.NEWSAPI_KEY,
      },
    });

    const articles = newsResponse.data.articles || [];
    let newCount = 0;
    let analyzedCount = 0;

    console.log(`📰 Found ${articles.length} articles from NewsAPI`);

    // 3. Process each article
    for (const article of articles) {
      try {
        // Insert article (skip if URL exists)
        const insertResult = await pool.query(`
          INSERT INTO news_articles (entity_id, title, description, url, source, published_at, content)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (url) DO NOTHING
          RETURNING id
        `, [
          entityId,
          article.title,
          article.description || '',
          article.url,
          article.source?.name || 'Unknown',
          article.publishedAt,
          article.content || ''
        ]);

        if (insertResult.rows.length === 0) {
          continue; // Article already exists
        }

        newCount++;
        const articleId = insertResult.rows[0].id;

        // Analyze sentiment with 2-stage system
        try {
          const analysis = await analyzeSentiment(article, entity);
          await pool.query(`
            INSERT INTO sentiment_scores (entity_id, article_id, sentiment_score, themes, state_code)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            entityId,
            articleId,
            analysis.sentiment_score,
            analysis.themes,
            analysis.region
          ]);
          analyzedCount++;
          console.log(`✅ Article analyzed: "${article.title.substring(0, 40)}..." → sentiment=${analysis.sentiment_score}`);
        } catch (analysisError) {
          console.warn(`⚠️  Failed to analyze article "${article.title.substring(0, 30)}...":`, (analysisError as Error).message);
          await pool.query(
            'INSERT INTO sentiment_scores (entity_id, article_id, sentiment_score) VALUES ($1, $2, $3)',
            [entityId, articleId, 0]
          );
        }
      } catch (articleError) {
        console.error('Error processing article:', articleError);
      }
    }

    // 5. Generate alerts
    await generateAlerts(entityId, pool);

    // 6. Aggregate regional sentiment for dashboard
    await aggregateRegionalSentiment(entityId, pool);

    console.log(`✅ News fetch complete: ${articles.length} found, ${newCount} new, ${analyzedCount} analyzed`);
    res.json({ fetched: articles.length, new: newCount, analyzed: analyzedCount });
  } catch (error) {
    console.error('❌ Error fetching news from NewsAPI:', error);
    res.status(500).json({ error: 'Failed to fetch news from NewsAPI' });
  }
});

// GET /api/alerts - Retrieve alerts from database
app.get('/api/alerts', async (req: Request, res: Response) => {
  try {
    const { entity_id, limit = '10' } = req.query;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    const result = await pool.query(`
      SELECT id, title, description, severity, alert_type,
             sentiment_change, triggered_at, is_active
      FROM alerts
      WHERE entity_id = $1 AND is_active = TRUE
      ORDER BY triggered_at DESC
      LIMIT $2
    `, [entity_id, parseInt(limit as string)]);

    console.log(`🔔 Retrieved ${result.rows.length} alerts`);
    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Chat endpoint with Claude AI integration
app.post('/api/chat', validateBody(CreateChatSchema), async (req: Request, res: Response) => {
  try {
    const { entity_id: entityId, message, context } = req.body;
    const conversationId = (req.body as any).conversationId;

    // 1. Fetch entity data
    const entityResult = await pool.query(
      'SELECT name, type FROM entities WHERE id = $1',
      [entityId]
    );
    if (entityResult.rows.length === 0) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }
    const entity = entityResult.rows[0];

    // 2. Fetch regional sentiment for context
    const sentimentResult = await pool.query(
      `SELECT state_name, region, avg_sentiment, mention_volume, top_themes
       FROM regional_sentiment_aggregated
       WHERE entity_id = $1
       ORDER BY mention_volume DESC
       LIMIT 5`,
      [entityId]
    );
    const sentimentContext = sentimentResult.rows.length > 0
      ? sentimentResult.rows
          .map(s => `${s.state_name} (${s.region}): sentimento ${s.avg_sentiment}, ${s.mention_volume} menções`)
          .join('\n')
      : 'Dados de sentimento ainda não disponíveis.';

    // 3. Load conversation history if conversationId provided
    let history: { role: 'user' | 'assistant'; content: string }[] = [];
    let convId = conversationId;

    if (conversationId) {
      const convResult = await pool.query(
        'SELECT messages FROM chat_conversations WHERE id = $1 AND entity_id = $2',
        [conversationId, entityId]
      );
      if (convResult.rows.length > 0 && convResult.rows[0].messages) {
        history = convResult.rows[0].messages;
      }
    }

    // 4. Call Claude API with context
    const systemPrompt = `Você é o AI Copilot do Social Sense, plataforma de inteligência de reputação.
Você está analisando dados de opinião pública para: ${entity.name} (${entity.type}).

Dados regionais atuais (top 5 por volume):
${sentimentContext}

Responda em português brasileiro. Seja conciso e estratégico.
Foque em insights acionáveis sobre sentimento, tendências, riscos e recomendações.
Cite números e regiões quando relevante.`;

    console.log(`💬 Chat: Processing message for ${entity.name}...`);

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: message }],
    });

    const responseText = claudeResponse.content[0].type === 'text'
      ? claudeResponse.content[0].text
      : 'Não foi possível gerar resposta.';

    // 5. Update message history
    const updatedHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: responseText },
    ];

    // 6. Save/update conversation in database
    if (convId) {
      await pool.query(
        'UPDATE chat_conversations SET messages = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedHistory), convId]
      );
    } else {
      const newConv = await pool.query(
        'INSERT INTO chat_conversations (entity_id, messages) VALUES ($1, $2) RETURNING id',
        [entityId, JSON.stringify(updatedHistory)]
      );
      convId = newConv.rows[0].id;
    }

    res.json({
      response: responseText,
      conversationId: convId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// ===== ADVANCED CHAT ENDPOINTS (BLOCO H) =====
import * as chatAnalysis from './utils/chat-analysis.js';
import * as exportGenerator from './utils/export-generator.js';

// GET /api/chat/conversations - List conversations
app.get('/api/chat/conversations', async (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    const result = await pool.query(`
      SELECT
        id,
        title,
        is_archived,
        tags,
        created_at,
        updated_at,
        (messages->0->>'content') as first_message
      FROM chat_conversations
      WHERE entity_id = $1 AND is_archived = FALSE
      ORDER BY updated_at DESC
      LIMIT 50
    `, [entity_id]);

    const conversations = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title || 'Conversa sem título',
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      preview: row.first_message ? row.first_message.substring(0, 100) : '',
    }));

    console.log(`📋 Retrieved ${conversations.length} conversations`);
    res.json({ conversations });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/chat/conversations/:id - Get single conversation
app.get('/api/chat/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const conversation = result.rows[0];
    console.log(`📖 Retrieved conversation ${id}`);
    res.json({
      id: conversation.id,
      entityId: conversation.entity_id,
      title: conversation.title,
      isArchived: conversation.is_archived,
      tags: conversation.tags,
      messages: conversation.messages,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    });
  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// PUT /api/chat/conversations/:id - Update conversation metadata
app.put('/api/chat/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, tags, isArchived } = req.body;

    const result = await pool.query(`
      UPDATE chat_conversations
      SET
        title = COALESCE($1, title),
        tags = COALESCE($2, tags),
        is_archived = COALESCE($3, is_archived),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [title, tags, isArchived, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    console.log(`✅ Updated conversation ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// DELETE /api/chat/conversations/:id - Archive conversation
app.delete('/api/chat/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE chat_conversations SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    console.log(`🗑️  Archived conversation ${id}`);
    res.json({ archived: true });
  } catch (error) {
    console.error('❌ Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// POST /api/chat/conversations/:id/follow-ups - Add follow-up question
app.post('/api/chat/conversations/:id/follow-ups', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, context } = req.body;

    if (!question) {
      res.status(400).json({ error: 'question required' });
      return;
    }

    // Get conversation for context
    const convResult = await pool.query(
      'SELECT entity_id, messages FROM chat_conversations WHERE id = $1',
      [id]
    );

    if (convResult.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const conversation = convResult.rows[0];
    const messages = conversation.messages || [];

    // Build system prompt with conversation context
    const systemPrompt = chatAnalysis.buildSystemPrompt('Entity', 'monitored entity');
    const historyText = chatAnalysis.formatConversationHistory(messages);

    // Call Claude for follow-up answer
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: historyText },
        { role: 'user', content: `Follow-up question: ${question}` },
      ],
    });

    const answer = (response.content[0] as any).text || '';
    const sources = chatAnalysis.extractSources(answer);

    // Save follow-up
    const result = await pool.query(`
      INSERT INTO chat_follow_ups (conversation_id, question, answer, sources)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, question, answer, sources]);

    console.log(`✅ Follow-up saved for conversation ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error processing follow-up:', error);
    res.status(500).json({ error: 'Failed to process follow-up' });
  }
});

// GET /api/chat/conversations/:id/follow-ups - Get follow-ups
app.get('/api/chat/conversations/:id/follow-ups', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM chat_follow_ups WHERE conversation_id = $1 ORDER BY created_at DESC',
      [id]
    );

    console.log(`📝 Retrieved ${result.rows.length} follow-ups`);
    res.json({ followUps: result.rows });
  } catch (error) {
    console.error('❌ Error fetching follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// POST /api/chat/conversations/:id/snippets - Save snippet
app.post('/api/chat/conversations/:id/snippets', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { snippetText, messageContext } = req.body;

    if (!snippetText) {
      res.status(400).json({ error: 'snippetText required' });
      return;
    }

    const result = await pool.query(`
      INSERT INTO chat_snippets (conversation_id, snippet_text, message_context)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, snippetText, messageContext]);

    console.log(`✅ Snippet saved for conversation ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error saving snippet:', error);
    res.status(500).json({ error: 'Failed to save snippet' });
  }
});

// GET /api/chat/conversations/:id/snippets - Get snippets
app.get('/api/chat/conversations/:id/snippets', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM chat_snippets WHERE conversation_id = $1 ORDER BY created_at DESC',
      [id]
    );

    console.log(`📌 Retrieved ${result.rows.length} snippets`);
    res.json({ snippets: result.rows });
  } catch (error) {
    console.error('❌ Error fetching snippets:', error);
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

// POST /api/chat/conversations/:id/export - Export conversation
app.post('/api/chat/conversations/:id/export', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format } = req.body;

    if (!exportGenerator.isValidExportFormat(format)) {
      res.status(400).json({ error: 'Invalid format. Use: pdf, markdown, or json' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const conversation = result.rows[0];
    const filename = exportGenerator.generateFilename(
      conversation.title || 'conversation',
      format
    );

    let content: string;
    switch (format) {
      case 'markdown':
        content = exportGenerator.generateMarkdown({
          id: conversation.id,
          title: conversation.title,
          entityName: conversation.entity_id,
          messages: conversation.messages || [],
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
        });
        break;
      case 'json':
        content = exportGenerator.generateJSON({
          id: conversation.id,
          title: conversation.title,
          entityName: conversation.entity_id,
          messages: conversation.messages || [],
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
        });
        break;
      case 'pdf':
      default:
        content = exportGenerator.generatePDFContent({
          id: conversation.id,
          title: conversation.title,
          entityName: conversation.entity_id,
          messages: conversation.messages || [],
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
        });
    }

    // Save export record
    const exportResult = await pool.query(`
      INSERT INTO chat_exports (conversation_id, format, download_url, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
      RETURNING id
    `, [id, format, `/exports/${filename}`]);

    console.log(`📥 Export created: ${format} - ${filename}`);
    res.json({
      exportId: exportResult.rows[0].id,
      format,
      filename,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('❌ Error exporting conversation:', error);
    res.status(500).json({ error: 'Failed to export conversation' });
  }
});

// GET /api/chat/search - Search conversations
app.get('/api/chat/search', async (req: Request, res: Response) => {
  try {
    const { entityId, q } = req.query;

    if (!entityId || !q) {
      res.status(400).json({ error: 'entityId and q (query) required' });
      return;
    }

    const query = (q as string).toLowerCase();

    const result = await pool.query(`
      SELECT
        cc.id,
        cc.title,
        cc.created_at,
        cc.messages,
        cm.content as match_text
      FROM chat_conversations cc
      LEFT JOIN LATERAL jsonb_array_elements(cc.messages) cm ON true
      WHERE cc.entity_id = $1
        AND (
          LOWER(cc.title) LIKE $2
          OR LOWER(cm.content) LIKE $2
        )
      GROUP BY cc.id, cm.content
      ORDER BY cc.updated_at DESC
      LIMIT 20
    `, [entityId, `%${query}%`]);

    const searchResults = result.rows.map((row: any) => ({
      conversationId: row.id,
      title: row.title,
      matchContext: row.match_text ? row.match_text.substring(0, 150) : '',
      createdAt: row.created_at,
    }));

    console.log(`🔍 Search found ${searchResults.length} results`);
    res.json({ results: searchResults });
  } catch (error) {
    console.error('❌ Error searching conversations:', error);
    res.status(500).json({ error: 'Failed to search conversations' });
  }
});

// ===== REAL-TIME UPDATES ENDPOINTS (BLOCO I) =====
import * as realTimeUtils from './utils/real-time-utils.js';
import * as attackDetectionUtils from './utils/attack-detection-utils.js';

// POST /api/events - Create real-time event
app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const { entityId, eventType, severity, title, description, data } = req.body;

    if (!entityId || !eventType || !severity || !title) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(`
      INSERT INTO real_time_events (entity_id, event_type, severity, title, description, data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [entityId, eventType, severity, title, description, JSON.stringify(data || {})]);

    const event = result.rows[0];
    console.log(`📢 Event created: ${severity} - ${title}`);
    res.json(event);
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET /api/events - Get real-time events
app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const { entity_id, severity, limit = '50' } = req.query;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    let query = `
      SELECT * FROM real_time_events
      WHERE entity_id = $1
    `;
    const params: any[] = [entity_id];

    if (severity) {
      query += ` AND severity = $${params.length + 1}`;
      params.push(severity);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    console.log(`📊 Retrieved ${result.rows.length} events`);
    res.json({ events: result.rows });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events/:id/acknowledge - Acknowledge event
app.post('/api/events/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE real_time_events SET is_acknowledged = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    console.log(`✅ Event ${id} acknowledged`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error acknowledging event:', error);
    res.status(500).json({ error: 'Failed to acknowledge event' });
  }
});

// GET /api/attacks - Get attack detection status
app.get('/api/attacks', async (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    // Get recent events for attack detection
    const result = await pool.query(`
      SELECT
        event_type,
        severity,
        created_at,
        data
      FROM real_time_events
      WHERE entity_id = $1
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 100
    `, [entity_id]);

    // Analyze for attack patterns
    const events = result.rows;
    const criticalCount = events.filter(e => e.severity === 'critical').length;
    const recentVolume = events.length;

    // Calculate attack indicators
    const indicators: any[] = [];
    if (criticalCount > 5) {
      indicators.push({
        type: 'CRITICAL_EVENT_SPIKE',
        confidence: Math.min(0.95, criticalCount * 0.15),
      });
    }

    const severity = attackDetectionUtils.calculateAttackSeverity(indicators);
    const isImminent = attackDetectionUtils.isAttackImminent(severity);
    const isOngoing = attackDetectionUtils.isAttackOngoing(severity, indicators.length);

    console.log(`⚔️ Attack analysis: severity=${severity.toFixed(0)}, iminente=${isImminent}, ongoing=${isOngoing}`);
    res.json({
      severity: severity.toFixed(0),
      isImminent,
      isOngoing,
      indicators,
      eventCount: recentVolume,
      criticalCount,
    });
  } catch (error) {
    console.error('❌ Error analyzing attacks:', error);
    res.status(500).json({ error: 'Failed to analyze attacks' });
  }
});

// ===== PERFORMANCE ANALYTICS ENDPOINTS (BLOCO K) =====
import * as performanceAnalytics from './utils/performance-analytics.js';

// POST /api/metrics - Record a metric
app.post('/api/metrics', async (req: Request, res: Response) => {
  try {
    const { entityId, metricName, metricValue, dimension } = req.body;

    if (!entityId || !metricName || metricValue === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(`
      INSERT INTO system_metrics (entity_id, metric_name, metric_value, dimension)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [entityId, metricName, metricValue, JSON.stringify(dimension || {})]);

    console.log(`📊 Metric recorded: ${metricName}=${metricValue}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error recording metric:', error);
    res.status(500).json({ error: 'Failed to record metric' });
  }
});

// GET /api/metrics - Get metrics with stats
app.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    const { entity_id, metricName, hours = '24' } = req.query;
    const hoursParam = parseInt(hours as string) || 24;

    if (!entity_id || !metricName) {
      res.status(400).json({ error: 'entity_id and metricName required' });
      return;
    }

    const result = await pool.query(`
      SELECT metric_value, created_at
      FROM system_metrics
      WHERE entity_id = $1
        AND metric_name = $2
        AND created_at > NOW() - INTERVAL '${hoursParam} hours'
      ORDER BY created_at DESC
      LIMIT 1000
    `, [entity_id, metricName]);

    const values = result.rows.map((r: any) => r.metric_value);
    const stats = performanceAnalytics.calculateStats(values);
    const trend = performanceAnalytics.calculateTrend(values);
    const slaViolation = performanceAnalytics.checkSLAViolation(metricName as string, values[0] || 0);

    // Aggregate data for charts
    const chartData = performanceAnalytics.aggregateByTimeBucket(
      result.rows.map((r: any) => ({
        timestamp: r.created_at,
        value: r.metric_value,
      })),
      5 // 5-minute buckets
    );

    console.log(`📈 Metrics retrieved: ${metricName} (${values.length} samples)`);
    res.json({
      metricName,
      stats,
      trend,
      slaViolation,
      chartData,
      dataPoints: values.length,
    });
  } catch (error) {
    console.error('❌ Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GET /api/health - Get overall system health
app.get('/api/health-score', async (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id required' });
      return;
    }

    // Get latest values for all key metrics
    const metricsResult = await pool.query(`
      SELECT DISTINCT ON (metric_name) metric_name, metric_value, created_at
      FROM system_metrics
      WHERE entity_id = $1
        AND created_at > NOW() - INTERVAL '1 hour'
      ORDER BY metric_name, created_at DESC
    `, [entity_id]);

    const violations: any[] = [];
    const metrics: any[] = [];

    metricsResult.rows.forEach((row: any) => {
      const violation = performanceAnalytics.checkSLAViolation(row.metric_name, row.metric_value);
      if (violation) {
        violations.push(violation);
      }

      const stats = performanceAnalytics.calculateStats([row.metric_value]);
      metrics.push({
        name: row.metric_name,
        current: row.metric_value,
        threshold: performanceAnalytics.SLA_THRESHOLDS[row.metric_name] || null,
        violation: violation ? true : false,
      });
    });

    const healthScore = performanceAnalytics.calculateHealthScore(violations);
    const healthStatus = performanceAnalytics.getHealthStatus(healthScore);

    console.log(`❤️ Health score: ${healthScore}/100 - ${healthStatus.status}`);
    res.json({
      healthScore,
      healthStatus,
      violations: violations.length,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error calculating health score:', error);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// GET /api/metrics/:metricName/trend - Get metric trend analysis
app.get('/api/metrics/:metricName/trend', async (req: Request, res: Response) => {
  try {
    const { metricName } = req.params;
    const { entityId, days = '7' } = req.query;
    const daysParam = parseInt(days as string) || 7;

    if (!entityId) {
      res.status(400).json({ error: 'entityId required' });
      return;
    }

    const validatedDays = validateDaysParameter(daysParam);
    const result = await pool.query(`
      SELECT metric_value, created_at
      FROM system_metrics
      WHERE entity_id = $1
        AND metric_name = $2
        AND created_at > NOW() - INTERVAL '1 day' * $3
      ORDER BY created_at
    `, [entityId, metricName, validatedDays]);

    const values = result.rows.map((r: any) => r.metric_value);
    const dataPoints = result.rows.map((r: any) => ({
      timestamp: r.created_at,
      value: r.metric_value,
    }));

    const stats = performanceAnalytics.calculateStats(values);
    const trend = performanceAnalytics.calculateTrend(values);

    // Split into periods for trend analysis
    const midpoint = Math.floor(values.length / 2);
    const firstPeriodAvg = values.slice(0, midpoint).reduce((a, b) => a + b) / midpoint || 0;
    const secondPeriodAvg = values.slice(midpoint).reduce((a, b) => a + b) / (values.length - midpoint) || 0;
    const periodChange = ((secondPeriodAvg - firstPeriodAvg) / (firstPeriodAvg || 1)) * 100;

    console.log(`📊 Trend analysis: ${metricName} - ${trend.trend} ${trend.percent.toFixed(1)}%`);
    res.json({
      metricName,
      stats,
      trend,
      periodChange: periodChange.toFixed(2),
      dataPoints,
      period: `${daysParam} days`,
    });
  } catch (error) {
    console.error('❌ Error analyzing trend:', error);
    res.status(500).json({ error: 'Failed to analyze trend' });
  }
});

// Import recommendation engine
import * as recommendationEngine from './utils/recommendation-engine.js';

// GET /api/recommendations - Get active recommendations for entity
app.get('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;

    if (!entity_id) {
      res.status(400).json({ error: 'entity_id query parameter required' });
      return;
    }

    const result = await pool.query(
      `SELECT
        id,
        title,
        description,
        priority,
        suggested_action as "suggestedAction",
        confidence_score as "confidenceScore",
        'active' as status,
        created_at as "createdAt"
      FROM action_recommendations
      WHERE entity_id = $1 AND is_acknowledged = FALSE
      ORDER BY created_at DESC
      LIMIT 10`,
      [entity_id]
    );

    console.log(`💡 Retrieved ${result.rows.length} recommendations for entity ${entity_id}`);
    res.json({ recommendations: result.rows });
  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// POST /api/recommendations/:id/approve - Approve recommendation
app.post('/api/recommendations/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const result = await pool.query(
      `UPDATE action_recommendations
       SET is_acknowledged = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    console.log(`✅ Approved recommendation ${id}`);
    res.json({ approved: true, recommendation: result.rows[0] });
  } catch (error) {
    console.error('❌ Error approving recommendation:', error);
    res.status(500).json({ error: 'Failed to approve recommendation' });
  }
});

// POST /api/recommendations/:id/review - Mark recommendation for review
app.post('/api/recommendations/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE action_recommendations
       SET is_acknowledged = FALSE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    console.log(`📋 Marked recommendation ${id} for review`);
    res.json({ inReview: true, recommendation: result.rows[0] });
  } catch (error) {
    console.error('❌ Error marking recommendation for review:', error);
    res.status(500).json({ error: 'Failed to mark for review' });
  }
});

// POST /api/recommendations/:id/dismiss - Dismiss recommendation
app.post('/api/recommendations/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE action_recommendations
       SET is_acknowledged = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    console.log(`❌ Dismissed recommendation ${id}: ${reason || 'no reason provided'}`);
    res.json({ dismissed: true, recommendation: result.rows[0] });
  } catch (error) {
    console.error('❌ Error dismissing recommendation:', error);
    res.status(500).json({ error: 'Failed to dismiss recommendation' });
  }
});

// POST /api/recommendations/generate - Generate recommendations based on current data
app.post('/api/recommendations/generate', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.body;

    if (!entityId) {
      res.status(400).json({ error: 'entityId required' });
      return;
    }

    // Fetch recent attack data, health score, SLA violations, anomalies
    const attacksResult = await pool.query(
      `SELECT * FROM real_time_events
       WHERE entity_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY severity DESC
       LIMIT 20`,
      [entityId]
    );

    const healthResult = await pool.query(
      `SELECT
        (SELECT AVG(CASE
          WHEN metric_name = 'response_time' AND metric_value > 500 THEN 0
          WHEN metric_name = 'error_rate' AND metric_value > 1 THEN 0
          WHEN metric_name = 'cpu_usage' AND metric_value > 80 THEN 0
          ELSE 100 END)
        FROM system_metrics
        WHERE entity_id = $1 AND created_at > NOW() - INTERVAL '24 hours') as health_score`,
      [entityId]
    );

    const anomaliesResult = await pool.query(
      `SELECT * FROM sentiment_trends
       WHERE entity_id = $1 AND metric_type = 'anomaly'
       AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 10`,
      [entityId]
    );

    // Build context for recommendation engine
    const context = {
      recentAttacks: attacksResult.rows,
      healthScore: healthResult.rows[0]?.health_score || 80,
      detectedAnomalies: anomaliesResult.rows,
      sentimentTrend: 'stable' as const,
    };

    // Generate recommendations
    const recommendations = recommendationEngine.recommendationEngine.generateRecommendations(
      entityId,
      context
    );

    // Save to database
    for (const rec of recommendations) {
      try {
        await pool.query(
          `INSERT INTO action_recommendations
           (entity_id, recommendation_type, priority, title, description, suggested_action, confidence_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            entityId,
            'auto_generated',
            rec.priority,
            rec.title,
            rec.description,
            rec.suggestedAction,
            rec.confidenceScore,
          ]
        );
      } catch (err: any) {
        console.warn('⚠️  Could not save recommendation:', err.message);
      }
    }

    console.log(`💡 Generated ${recommendations.length} recommendations for entity ${entityId}`);
    res.json({ generated: recommendations.length, recommendations });
  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// DEBUG: Clear all news articles (development only)
app.post('/api/admin/clear-news', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({ error: 'Only available in development' });
    return;
  }
  try {
    await pool.query('DELETE FROM sentiment_scores WHERE article_id IS NOT NULL');
    const result = await pool.query('DELETE FROM news_articles');
    console.log(`🗑️  Cleared ${result.rowCount} articles and sentiment scores`);
    res.json({ cleared: result.rowCount });
  } catch (error) {
    console.error('Error clearing news:', error);
    res.status(500).json({ error: 'Failed to clear news' });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Social Sense API',
    version: '0.1.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      entities: {
        list: 'GET /api/entities',
        get: 'GET /api/entities/:id',
        create: 'POST /api/entities',
      },
      geographic_analysis: {
        regional_sentiment: 'GET /api/geo/regional-sentiment?entityId=<UUID>',
      },
      sentiment: 'GET /api/sentiment/:entityId',
      chat: 'POST /api/chat',
    },
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function start() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 API documentation: http://localhost:${PORT}`);
    console.log(`🔗 Frontend: http://localhost:3000`);
    console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
