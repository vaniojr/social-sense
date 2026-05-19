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
    const { method, url, query, body } = req;
    // Route: /api/competitor-groups
    if (url?.startsWith('/api/competitor-groups')) {
      // POST /api/competitor-groups
      if (method === 'POST' && url === '/api/competitor-groups') {
        const { name, description } = body;
        const result = await pool.query(
          'INSERT INTO competitor_groups (name, description) VALUES ($1, $2) RETURNING *',
          [name, description || null]
        );
        res.status(201).json(result.rows[0]);
        return;
      }
      // GET /api/competitor-groups
      if (method === 'GET' && url === '/api/competitor-groups') {
        const result = await pool.query('SELECT * FROM competitor_groups ORDER BY created_at DESC');
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
        return;
      }
      // GET /api/competitor-groups/:id
      const matchId = url.match(/^\/api\/competitor-groups\/(\w+)/);
      if (method === 'GET' && matchId) {
        const id = matchId[1];
        const groupResult = await pool.query('SELECT * FROM competitor_groups WHERE id = $1', [id]);
        if (groupResult.rows.length === 0) {
          res.status(404).json({ error: 'Group not found' });
          return;
        }
        const membersResult = await pool.query(
          `SELECT e.id, e.name, e.type, cgm.added_at FROM competitor_group_members cgm JOIN entities e ON e.id = cgm.entity_id WHERE cgm.group_id = $1 ORDER BY cgm.added_at DESC`,
          [id]
        );
        res.json({ ...groupResult.rows[0], members: membersResult.rows });
        return;
      }
      // PUT /api/competitor-groups/:id
      const matchPut = url.match(/^\/api\/competitor-groups\/(\w+)/);
      if (method === 'PUT' && matchPut) {
        const id = matchPut[1];
        const { name, description } = body;
        const result = await pool.query(
          'UPDATE competitor_groups SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
          [name, description || null, id]
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Group not found' });
          return;
        }
        res.json(result.rows[0]);
        return;
      }
      // DELETE /api/competitor-groups/:id
      const matchDelete = url.match(/^\/api\/competitor-groups\/(\w+)/);
      if (method === 'DELETE' && matchDelete) {
        const id = matchDelete[1];
        const result = await pool.query('DELETE FROM competitor_groups WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Group not found' });
          return;
        }
        res.json({ deleted: true });
        return;
      }
      // POST /api/competitor-groups/:id/members
      const matchAddMember = url.match(/^\/api\/competitor-groups\/(\w+)\/members$/);
      if (method === 'POST' && matchAddMember) {
        const id = matchAddMember[1];
        const { entityId } = body;
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
        res.status(201).json({ id: result.rows[0].id, entity_id: entityId });
        return;
      }
      // DELETE /api/competitor-groups/:id/members/:entityId
      const matchRemoveMember = url.match(/^\/api\/competitor-groups\/(\w+)\/members\/(\w+)$/);
      if (method === 'DELETE' && matchRemoveMember) {
        const id = matchRemoveMember[1];
        const entityId = matchRemoveMember[2];
        const result = await pool.query(
          'DELETE FROM competitor_group_members WHERE group_id = $1 AND entity_id = $2 RETURNING *',
          [id, entityId]
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Member not found in group' });
          return;
        }
        res.json({ deleted: true });
        return;
      }
    }
    res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    await pool.end();
  }
}
