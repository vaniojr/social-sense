import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import dotenv from 'dotenv';
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
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      timestamp: new Date(),
      database: 'connected',
      query_time: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date(),
      database: 'disconnected',
      error: error.message || 'Unknown error',
    });
  } finally {
    await pool.end();
  }
}
