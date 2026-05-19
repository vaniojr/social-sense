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
    if (req.method === 'GET') {
      // /api/entities or /api/entities/:id
      const id = req.query.id as string | undefined;
      if (id) {
        const result = await pool.query('SELECT * FROM entities WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Entity not found' });
        } else {
          res.json(result.rows[0]);
        }
      } else {
        const result = await pool.query('SELECT * FROM entities ORDER BY created_at DESC');
        res.json(result.rows);
      }
    } else if (req.method === 'POST') {
      const { name, description, type, url } = req.body;
      const result = await pool.query(
        'INSERT INTO entities (name, description, type, url) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, type, url],
      );
      res.status(201).json(result.rows[0]);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    await pool.end();
  }
}
