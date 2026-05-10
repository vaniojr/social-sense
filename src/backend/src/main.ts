import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

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

// Geographic Analysis - Regional Sentiment
app.get('/api/geo/regional-sentiment', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.query;

    let query: string;
    const params: (string | undefined)[] = [];

    if (entityId) {
      query = `
        SELECT
          rsa.state_code,
          rsa.state_name,
          rsa.region,
          rsa.avg_sentiment,
          rsa.mention_volume,
          rsa.top_themes,
          rsa.last_updated,
          e.name as entity_name
        FROM regional_sentiment_aggregated rsa
        JOIN entities e ON e.id = rsa.entity_id
        WHERE rsa.entity_id = $1
        ORDER BY rsa.avg_sentiment DESC
      `;
      params.push(entityId as string);
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
