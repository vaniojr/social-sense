import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

dotenv.config();

// Initialize Claude API client
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'socialsense',
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000',
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

app.post('/api/entities', async (req: Request, res: Response) => {
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
app.put('/api/entities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, type, url, priority_regions, alert_preferences } = req.body;

    // Validate priority regions (must be valid state codes)
    if (priority_regions) {
      const validStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
      for (const region of priority_regions) {
        if (!validStates.includes(region)) {
          res.status(400).json({ error: `Invalid state code: ${region}` });
          return;
        }
      }
    }

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
app.post('/api/competitor-groups', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name required' });
      return;
    }

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
      const result = await pool.query(`
        SELECT
          AVG(ss.sentiment_score) as avg_sentiment,
          COUNT(*) as mention_volume,
          ss.state_code
        FROM sentiment_scores ss
        WHERE ss.entity_id = $1
          AND ss.created_at > NOW() - INTERVAL '${parseInt(daysParam)} days'
        GROUP BY ss.state_code
      `, [entityId]);

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
          AND ss.created_at > NOW() - INTERVAL '${parseInt(daysParam)} days'
        GROUP BY DATE(ss.created_at)
        ORDER BY DATE(ss.created_at)
      `, [entityId]);

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
    const { entityId, limit = '50', days = '7' } = req.query;

    if (!entityId) {
      res.status(400).json({ error: 'entityId required' });
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
    `, [entityId, parseInt(limit as string)]);

    console.log(`📰 Retrieved ${result.rows.length} news articles`);
    res.json({ articles: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /api/news/filtered - Retrieve news with advanced filtering
app.get('/api/news/filtered', async (req: Request, res: Response) => {
  try {
    const entityIdParam = req.query.entityId as string;
    const limitParam = (req.query.limit as string) || '50';
    const daysParam = (req.query.days as string) || '7';
    const sentimentParam = req.query.sentiment as string;
    const sourceParam = req.query.source as string;
    const regionParam = req.query.region as string;
    const offsetParam = (req.query.offset as string) || '0';

    if (!entityIdParam) {
      res.status(400).json({ error: 'entityId required' });
      return;
    }

    let query = `
      SELECT
        na.id, na.title, na.description, na.source,
        na.url, na.published_at, na.content,
        ss.sentiment_score, ss.themes, ss.state_code, ss.region
      FROM news_articles na
      LEFT JOIN sentiment_scores ss ON ss.article_id = na.id
      WHERE na.entity_id = $1
        AND na.published_at > NOW() - INTERVAL '${parseInt(daysParam)} days'
    `;

    const params: (string | number)[] = [entityIdParam];
    let paramIndex = 2;

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
    const { entityId, limit = '10' } = req.query;

    if (!entityId) {
      res.status(400).json({ error: 'entityId required' });
      return;
    }

    const result = await pool.query(`
      SELECT id, title, description, severity, alert_type,
             sentiment_change, triggered_at, is_active
      FROM alerts
      WHERE entity_id = $1 AND is_active = TRUE
      ORDER BY triggered_at DESC
      LIMIT $2
    `, [entityId, parseInt(limit as string)]);

    console.log(`🔔 Retrieved ${result.rows.length} alerts`);
    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Chat endpoint with Claude AI integration
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { entityId, message, conversationId } = req.body;

    // Validate inputs
    if (!entityId || !message) {
      res.status(400).json({ error: 'Missing entityId or message' });
      return;
    }

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
