# Tech Stack - SentimentHub (Plataforma Multi-Vertical)

## Overview

**Stack agnóstico de vertical:** Mesma infraestrutura serve Política, Influencers e Brands.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Lovable (React) | AI-powered UI builder, fast iteration, multi-vertical UI |
| **Backend** | Supabase | PostgreSQL + Auth + Real-time + Edge Functions, scales multi-vertical |
| **Automation** | n8n | Visual workflows, 1000+ integrations (news + social + brands APIs) |
| **LLM - Analysis** | Claude API | Best for nuanced analysis, sentimento, comparison (language-agnostic) |
| **LLM - Content** | GPT-4o | Creative content generation (respostas, sugestões) |
| **Real-time** | Supabase Realtime | WebSocket, built-in, handles multi-persona updates |
| **Job Queue** | QStash (Upstash) | Rate limiting across multiple API sources |
| **Deployment** | Cloud Run + Vercel | Serverless, auto-scales com múltiplas verticais |
| **Monitoring** | Grafana | Track metrics por vertical (política vs influencers) |

## Key Technologies for New Features

### Geographic Analysis: Supabase PostGIS ⭐
**Purpose:** Store and query geographic data efficiently
- Native PostgreSQL extension for geographic queries
- Heat map generation from lat/long + sentiment scores
- Group by state/region aggregation
- Built-in Supabase support

**Library:** Recharts (for Brazil map visualization)

### Chat AI Copilot: Claude API ⭐
**Purpose:** Understand natural language questions and answer with data context
- Send user question + relevant data (sentiment, trends, regional scores)
- Claude understands context and generates insightful responses
- Stream responses for real-time UI updates
- Portuguese language support

---

## Detailed Justification

### Frontend: Lovable (React)
**Why:**
- ✅ AI-powered UI builder → **fast iteration** (rebuild entire dashboard in 1-2 hours)
- ✅ Pre-built components (cards, charts, modals) → **ship faster**
- ✅ Integrates with Supabase client → **real-time updates out of the box**
- ✅ TypeScript support → **fewer bugs**
- ✅ Exports clean React code → **not vendor-locked**

**Alternatives considered:**
- ❌ Retool: More expensive, less customizable
- ❌ Bubble: Slower, harder to integrate LLMs

**Key libraries:**
```json
{
  "react": "^18.2.0",
  "recharts": "^2.x", // charts + geographic maps ⭐
  "zustand": "^4.x", // state management
  "@supabase/supabase-js": "^2.x", // DB + real-time + PostGIS
  "@anthropic-ai/sdk": "^0.x", // Claude API for chat copilot ⭐
  "lucide-react": "^0.x" // icons
}
```

### Backend: Supabase
**Why:**
- ✅ **PostgreSQL** → robust, powerful queries, JSONB support
- ✅ **Auth built-in** → JWT, multi-factor auth, no separate auth service
- ✅ **Real-time subscriptions** → WebSocket for live dashboard updates
- ✅ **Edge Functions** → serverless TypeScript, deploy instantly
- ✅ **Vector search** (via pgvector) → semantic search on news
- ✅ **No DevOps** → managed by Supabase, 99.99% uptime

**Alternatives considered:**
- ❌ Firebase: Expensive for this use case, less control over data
- ❌ AWS (RDS + Lambda): More operational overhead
- ❌ Postgres.js + custom auth: Too much boilerplate

**Key features used:**
- Realtime subscriptions on `news_items`, `alerts`, `sentiment_scores`
- Edge Functions for LLM API calls
- PostGIS for geographic queries (future: regional sentiment)
- Row-level security (RLS) for multi-tenant isolation

### Automation: n8n
**Why:**
- ✅ **Visual workflows** → easy to modify without code
- ✅ **1000+ pre-built nodes** → integrates with most APIs
- ✅ **Open-source** → can self-host if needed
- ✅ **Webhooks** → trigger from external services
- ✅ **Scheduling** → cron jobs for periodic monitoring
- ✅ **Error handling** → retry logic, alerts on failure

**Alternatives considered:**
- ❌ Zapier: More expensive, less control
- ❌ Make (Integromat): Fewer integrations, slower
- ❌ Custom Python scripts: More maintenance, no visual interface

**Key workflows:**
1. **News Aggregation** (every 30min)
   - Trigger: Schedule
   - Action: Fetch from NewsAPI, filter keywords
   - Output: POST to Supabase Edge Function
   
2. **Social Media Monitoring** (every 1-2 hours)
   - Trigger: Schedule
   - Action: Query X API, Instagram API, TikTok API
   - Output: POST to Supabase Edge Function

3. **Keyword Alerts** (real-time)
   - Trigger: Webhook from social listening service
   - Action: Immediately POST to Supabase Edge Function
   - Output: Create alert in DB

### LLM: Claude API (Analysis)
**Why:**
- ✅ **Best reasoning** → nuanced sentiment analysis
- ✅ **Long context** → summarize long articles without truncation
- ✅ **Structured output** → JSON mode for consistent results
- ✅ **Cost-effective** → cheaper than GPT-4 Turbo for our use case
- ✅ **Strong on Portuguese** → good multilingual support

**Use cases:**
- Summarize news articles (300→100 words)
- Analyze sentiment of news headline
- Compare candidate positions
- Detect attack patterns
- Extract key topics from posts

**Example prompt:**
```
Analise o sentimento desta notícia sobre o candidato X:
[news text]

Responda em JSON:
{
  "sentiment": "positive|neutral|negative",
  "score": -1 to +1,
  "threat_level": "low|medium|high|critical",
  "keywords": ["..."],
  "summary": "..."
}
```

### LLM: GPT-4o (Content Generation)
**Why:**
- ✅ **Better at creative writing** → generate response suggestions
- ✅ **Multimodal** → can process images for deepfake detection (future)
- ✅ **Faster** → lower latency for real-time suggestions

**Use cases:**
- Generate response suggestions to criticism
- Draft social media posts
- Create debate talking points
- Generate video script suggestions

### Real-time: Supabase Realtime
**Why:**
- ✅ **Built-in to Supabase** → no extra service
- ✅ **WebSocket-based** → true real-time (< 100ms)
- ✅ **Scales well** → handles 10k+ concurrent connections
- ✅ **Easy to use** → subscribe to table changes in JavaScript

**Usage example:**
```typescript
const subscription = supabase
  .from('alerts')
  .on('INSERT', (payload) => {
    // Flash new alert in dashboard
    updateAlerts(payload.new)
  })
  .subscribe()
```

### Job Queue: QStash (Upstash)
**Why:**
- ✅ **Serverless** → no infrastructure to manage
- ✅ **Built for Edge Functions** → integrate with Supabase
- ✅ **Rate limiting** → delay requests to respect API limits
- ✅ **Retry logic** → automatic exponential backoff
- ✅ **Free tier** → 100 messages/day free

**Use cases:**
- Delay sentiment analysis jobs to respect API rate limits
- Retry failed LLM API calls
- Schedule periodic news refresh
- Batch social media scraping

### Deployment: Cloud Run + Vercel
**Why:**
- ✅ **Cloud Run:** Edge Functions deploy automatically, auto-scales, pay-per-request
- ✅ **Vercel:** Frontend hosting, global CDN, auto-deploys on git push
- ✅ **Minimal ops:** No servers to manage

**Alternative:** AWS Lambda + CloudFront (more expensive, more setup)

### Monitoring: Grafana
**Why:**
- ✅ **Free tier** → no cost initially
- ✅ **Open-source** → self-hosted option if needed
- ✅ **Integrates everywhere** → Supabase logs, Cloud Run metrics, n8n execution logs
- ✅ **Good dashboards** → visualize API latency, error rates, queue depth

**Key metrics:**
- API response time (p50, p95, p99)
- n8n workflow success rate
- Database query latency
- Alert creation rate
- Error rate by component

## Development Stack (Local)

```bash
# Runtime
node 18+ / npm 9+

# Frontend development
npm run dev          # Lovable dev server (localhost:3000)
npm run build        # Build for production

# Backend development
supabase start       # Local Supabase instance
supabase db push     # Apply migrations
supabase functions deploy  # Deploy Edge Functions

# Automation
# n8n self-hosted (Docker) or n8n Cloud

# Testing
npm test             # Jest
npm run test:e2e     # Playwright E2E tests

# Linting
npm run lint         # ESLint
npm run format       # Prettier
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # for server-side

# LLM APIs
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx

# External APIs
NEWSAPI_KEY=xxx
TWITTER_API_KEY=xxx
INSTAGRAM_ACCESS_TOKEN=xxx
TIKTOK_ACCESS_TOKEN=xxx

# Job Queue
QSTASH_TOKEN=xxx

# Notifications
SENDGRID_API_KEY=xxx
SLACK_WEBHOOK_URL=xxx

# Monitoring
GRAFANA_URL=xxx
GRAFANA_API_KEY=xxx
```

## Cost Estimation (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| **Supabase** | 100k requests/mo | $25 |
| **Cloud Run** | 1M requests/mo @ 0.5s avg | $10–20 |
| **Vercel** | Frontend hosting | $0 (free tier) |
| **OpenAI API** | 100k tokens/mo | $5–10 |
| **Claude API** | 50k tokens/mo | $3–5 |
| **QStash** | 100k messages/mo | $0–10 |
| **n8n Cloud** | 1M executions/mo | $20–50 |
| **NewsAPI** | 10k/day | $0 (free tier) |
| **Monitoring (Grafana)** | - | $0 (free tier) |
| **TOTAL** | - | **~$65–130/mo** |

**Note:** Costs scale with usage. First customer paying R$2k/mo covers infra costs.

## Why NOT These Choices

| What | Why not |
|------|---------|
| Django/Flask | Too slow to iterate, need more DevOps |
| Vue.js | Same as React, but smaller ecosystem |
| MongoDB | ACID transactions less important here than data flexibility |
| Firebase Realtime DB | More expensive, less control, worse queries |
| Lambda directly | More operational overhead than Cloud Run |
| Retool | Slower iteration, costs more upfront |
| Segment.io | Overkill for our analytics needs |

## Migration Path (Future)

If service needs change:
- **Frontend:** Can migrate from Lovable → Next.js (export code exists)
- **Backend:** Can migrate from Supabase → AWS RDS + Lambda (data is standard PostgreSQL)
- **Automation:** Can migrate from n8n → AWS EventBridge + Lambda (workflows are portable)
- **LLM:** Can swap Claude ↔ GPT-4 in prompts (APIs are similar)

This modularity prevents vendor lock-in.
