import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

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

// Candidates endpoints
app.get('/api/candidates', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM candidates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

app.get('/api/candidates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM candidates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

app.post('/api/candidates', async (req: Request, res: Response) => {
  try {
    const { name, description, category, url } = req.body;
    const result = await pool.query(
      'INSERT INTO candidates (name, description, category, url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, category, url],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// Geographic Analysis - Regional Sentiment
app.get('/api/geo/regional-sentiment', async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.query;

    let query: string;
    const params: (string | undefined)[] = [];

    if (candidateId) {
      query = `
        SELECT
          rsa.state_code,
          rsa.state_name,
          rsa.region,
          rsa.avg_sentiment,
          rsa.mention_volume,
          rsa.top_themes,
          rsa.last_updated,
          c.name as candidate_name
        FROM regional_sentiment_aggregated rsa
        JOIN candidates c ON c.id = rsa.candidate_id
        WHERE rsa.candidate_id = $1
        ORDER BY rsa.avg_sentiment DESC
      `;
      params.push(candidateId as string);
    } else {
      query = `
        SELECT
          rsa.state_code,
          rsa.state_name,
          rsa.region,
          rsa.avg_sentiment,
          rsa.mention_volume,
          rsa.top_themes,
          rsa.last_updated
        FROM regional_sentiment_aggregated rsa
        ORDER BY rsa.avg_sentiment DESC
      `;
    }

    const result = await pool.query(query, params);

    // Calculate statistics
    const states = result.rows;
    const sentiments = states.map((s: any) => typeof s.avg_sentiment === 'string' ? parseFloat(s.avg_sentiment) : s.avg_sentiment);
    const bestState = states[0] || null;
    const worstState = states[states.length - 1] || null;
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length
      : null;

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
app.get('/api/sentiment/:candidateId', async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    const result = await pool.query(
      `SELECT region, state_code, AVG(sentiment_score) as avg_sentiment, COUNT(*) as volume
       FROM sentiment_scores
       WHERE candidate_id = $1
       GROUP BY region, state_code
       ORDER BY avg_sentiment DESC`,
      [candidateId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment' });
  }
});

// Chat endpoint (placeholder)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, candidateId } = req.body;

    // TODO: Implement Claude API integration
    const response = `Echo: ${message}`;

    res.json({
      message: response,
      source: 'claude',
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
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
      candidates: {
        list: 'GET /api/candidates',
        get: 'GET /api/candidates/:id',
        create: 'POST /api/candidates',
      },
      geographic_analysis: {
        regional_sentiment: 'GET /api/geo/regional-sentiment?candidateId=<UUID>',
      },
      sentiment: 'GET /api/sentiment/:candidateId',
      chat: 'POST /api/chat',
    },
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}`);
  console.log(`🔗 Frontend: http://localhost:3000`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
