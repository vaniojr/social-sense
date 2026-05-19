import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as trendAnalysis from '../src/utils/trend-analysis.js';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
const connectionUsesSsl = databaseUrl && !databaseUrl.includes('localhost');

function getPool() {
  return databaseUrl
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = getPool();
  try {
    const { method, url, query } = req;
    // GET /api/trends/timeline
    if (method === 'GET' && url?.startsWith('/api/trends/timeline')) {
      const { entity_id, days = '30' } = query;
      const daysParam = parseInt(days as string) || 30;
      if (!entity_id) {
        res.status(400).json({ error: 'entity_id required' });
        return;
      }
      const validatedDays = Math.max(1, Math.min(daysParam, 365));
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
      const timeline = result.rows.map((row: any) => ({
        date: row.date,
        sentiment_avg: parseFloat(row.sentiment_avg || 0),
        sentiment_change_pct: 0,
        volume: parseInt(row.volume),
        regions_positive: row.regions_positive || [],
        regions_negative: row.regions_negative || [],
      }));
      for (let i = 1; i < timeline.length; i++) {
        const prev = timeline[i - 1].sentiment_avg;
        const curr = timeline[i].sentiment_avg;
        timeline[i].sentiment_change_pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
      }
      const report = trendAnalysis.generateTimelineReport(timeline);
      res.json(report);
      return;
    }
    // GET /api/trends/anomalies
    if (method === 'GET' && url?.startsWith('/api/trends/anomalies')) {
      const { entity_id, sensitivity = '2.5' } = query;
      const sensParam = parseFloat(sensitivity as string) || 2.5;
      if (!entity_id) {
        res.status(400).json({ error: 'entity_id required' });
        return;
      }
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
      const timeline = result.rows.map((row: any) => ({
        date: row.date,
        sentiment_avg: parseFloat(row.sentiment_avg || 0),
        sentiment_change_pct: 0,
        volume: parseInt(row.volume),
        regions_positive: [],
        regions_negative: [],
      }));
      const anomalies = trendAnalysis.detectAnomalies(timeline, sensParam);
      res.json({ anomalies });
      return;
    }
    // GET /api/trends/theme-evolution
    if (method === 'GET' && url?.startsWith('/api/trends/theme-evolution')) {
      const { entity_id, days = '30' } = query;
      const daysParam = parseInt(days as string) || 30;
      if (!entity_id) {
        res.status(400).json({ error: 'entity_id required' });
        return;
      }
      const validatedDays = Math.max(1, Math.min(daysParam, 365));
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
      const themeMap: { [key: string]: any } = {};
      result.rows.forEach((row: any) => {
        const key = `${row.date}_${row.theme}`;
        if (!themeMap[key]) {
          themeMap[key] = { date: row.date, theme: row.theme, sentiment: 0, count: 0 };
        }
        themeMap[key].sentiment += parseFloat(row.sentiment || 0);
        themeMap[key].count += 1;
      });
      const evolution = Object.values(themeMap).map((item: any) => ({
        date: item.date,
        theme: item.theme,
        sentiment: item.count > 0 ? parseFloat((item.sentiment / item.count).toFixed(2)) : 0,
      }));
      res.json({ evolution });
      return;
    }
    res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    await pool.end();
  }
}
