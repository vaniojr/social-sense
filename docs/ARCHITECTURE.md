# Arquitetura Técnica - Social Sense

## 1. Visão de Alto Nível

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                  │
│              Real-time Dashboard (Vercel in Production)           │
│         (Maps, charts, alerts, chat interface)                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST/WebSocket
┌──────────────────────────▼───────────────────────────────────────┐
│              Backend (Node.js/Express OR Python/FastAPI)          │
│                  (Railway in Production)                          │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐      │
│  │ API Routes     │  │ Controllers  │  │ Database Client │      │
│  │ (endpoints)    │  │ (business    │  │ (PostgreSQL)    │      │
│  │                │  │  logic)      │  │                 │      │
│  └────────────────┘  └──────────────┘  └─────────────────┘      │
│                                                                    │
│  Services:                                                         │
│  ├── Claude API integration (analysis, summarization)            │
│  ├── News aggregation (NewsAPI + RSS)                            │
│  ├── Sentiment analysis                                           │
│  ├── Geographic data processing                                   │
│  └── Real-time alerts                                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│            Database (PostgreSQL with Docker)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐      │
│  │ News/Alerts  │  │ Sentiment    │  │ Geographic Data   │      │
│  │              │  │ Analysis     │  │ (PostGIS)         │      │
│  └──────────────┘  └──────────────┘  └───────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼──────┐  ┌──────▼──────────┐
│  GitHub Actions│  │ Claude API  │  │  External APIs  │
│ (Automation)   │  │ (Analysis)  │  │ (News, Location)│
│                │  │             │  │                 │
│ • News scraper │  │ • Sentiment │  │ • NewsAPI       │
│ • Scheduled    │  │ • Summary   │  │ • Location Data │
│   monitoring   │  │ • Chat      │  │                 │
│ • Alerts       │  │ • Compare   │  │                 │
└────────────────┘  └─────────────┘  └─────────────────┘
```

---

## 2. Componentes Principais

### Frontend (React + TypeScript)
- **Tech:** React 18+ with TypeScript, TailwindCSS, Recharts
- **Responsibility:** User interface, real-time updates, data visualization
- **Key Libraries:**
  - `recharts` - charts and heat maps
  - `react-hook-form` - form handling
  - `axios` or `fetch` - API calls
  - `zustand` or `context-api` - state management
- **Deployment:** Vercel (auto-deploy on git push)
- **Location:** `src/frontend/`

### Backend (Node.js + Express OR Python + FastAPI)
- **Tech Options:**
  - **Node.js:** Express.js, TypeScript
  - **Python:** FastAPI, async/await
- **Responsibility:** API endpoints, business logic, Claude integration
- **Key Libraries:**
  - Claude SDK (`@anthropic-ai/sdk` or anthropic)
  - `pg` (Node) or `psycopg2` (Python) - database driver
  - `axios` - HTTP client for external APIs
  - `dotenv` - environment variables
- **Deployment:** Railway (with PostgreSQL database)
- **Location:** `src/backend/`

### Database (PostgreSQL)
- **Local Development:** Docker container via `docker-compose.yml`
- **Production:** PostgreSQL on Railway
- **Features:**
  - PostGIS extension for geographic data (lat/long queries)
  - JSONB for storing sentiment analysis results
  - Full-text search for news/content
- **Key Tables:**
  - `candidates` / `personas` - monitored entities
  - `news_articles` - aggregated news
  - `sentiment_scores` - regional analysis
  - `alerts` - crisis detection
  - `chat_history` - copilot conversations

### Automation (GitHub Actions + Python/Node Scripts)
- **Responsibility:** Scheduled tasks, data collection, processing
- **Workflows:**
  - News aggregation (hourly)
  - Sentiment analysis (periodic)
  - Alert triggers (real-time)
  - Regional sentiment updates (periodic)
- **Location:** `.github/workflows/` + `src/scripts/`

---

## 3. Data Flow Diagrams

### Flow 1: Geographic Analysis (Real-time Regional Aggregation) ⭐

```
News Articles / Social Media Posts with location info
    │
    ├─→ Extract location (from article, post metadata)
    │
    ├─→ Backend: Call Claude API for sentiment analysis
    │
    ├─→ Store with: sentiment_score, region, state, lat/long, timestamp
    │
    ├─→ Aggregate by state/region (GROUP BY region, AVG sentiment)
    │
    ├─→ Calculate regional scores:
    │   ├─ North: +0.3 (100 mentions)
    │   ├─ Northeast: -0.1 (350 mentions)
    │   ├─ Southeast: +0.7 (500 mentions)
    │   ├─ South: +0.5 (200 mentions)
    │   └─ Center-West: +0.2 (100 mentions)
    │
    ├─→ Update database (sentiment_scores table)
    │
    └─→ Frontend: Real-time update via WebSocket/polling
         ├─ Brazil heat map (red=-1 to green=+1)
         ├─ Regional ranking table
         └─ Top 5 themes per region
```

### Flow 2: News Aggregation + Analysis (Scheduled)

```
GitHub Actions (schedule: daily 6 AM)
    │
    ├─→ NewsAPI: Fetch recent news about candidates
    │
    ├─→ RSS Feeds: Scrape Brazilian news portals
    │
    ├─→ Store in database (news_articles table)
    │
    ├─→ Backend processes each article:
    │   ├─ Claude API: Analyze sentiment
    │   ├─ Extract topics/themes
    │   ├─ Extract location (if mentioned)
    │   ├─ Calculate regional impact
    │   └─ Trigger alerts if sentiment drops
    │
    ├─→ Update sentiment_scores with new data
    │
    └─→ Notify users of significant changes (email/dashboard)
```

### Flow 3: Chat AI Copilot (Real-time)

```
User asks: "Where is my competitor growing?"
    │
    ├─→ Frontend: Capture question
    │
    ├─→ Backend /api/chat endpoint
    │   ├─ Query database for relevant data:
    │   │  ├─ Regional sentiment (all states)
    │   │  ├─ Competitor mention volume by region
    │   │  ├─ Growth trends
    │   │  └─ Recent news about competitor
    │   │
    │   ├─ Call Claude API with:
    │   │  ├─ System prompt: "You are a political analysis expert"
    │   │  ├─ Context: aggregated data
    │   │  └─ User question
    │   │
    │   └─ Stream response back to frontend
    │
    └─→ Frontend: Display response in chat interface
```

### Flow 4: Crisis Alert Detection (Real-time)

```
New sentiment data arrives
    │
    ├─→ Compare current score vs 7-day average
    │
    ├─→ Check for threshold breach:
    │   ├─ If sentiment_change > -20% → ALERT
    │   ├─ If mention_volume > 5x normal → ALERT
    │   └─ If attack pattern detected → ALERT
    │
    ├─→ Create alert record in database
    │
    └─→ Notify user:
        ├─ Dashboard notification
        ├─ Email alert
        └─ Webhook (optional: Slack, etc)
```

---

## 4. Technology Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | React + TypeScript | Industry standard, component-based, easy state management |
| **Backend** | Node.js/Express OR Python/FastAPI | Both have excellent Claude SDK support; choose based on team expertise |
| **Database** | PostgreSQL | Open-source, powerful, PostGIS for geographic queries |
| **Deployment** | Vercel + Railway | Vercel for frontend (fast edge deployment), Railway for backend (PostgreSQL included) |
| **AI Analysis** | Claude API | Best reasoning for nuanced sentiment analysis; supports streaming |
| **Data Collection** | GitHub Actions + scripts | Free, scheduled, no external automation platform needed |
| **Monitoring** | Sentry + GitHub Actions logs | Error tracking + deployment visibility |

---

## 5. Key Features Implementation

### 🗺️ Geographic Analysis
- **Database:** `sentiment_scores` table with PostGIS coordinates
- **Backend:** Aggregate by state, calculate regional averages
- **Frontend:** Heat map using Recharts or Mapbox
- **Update frequency:** Real-time or hourly

### 💬 Chat AI Copilot
- **Backend:** `/api/chat` endpoint
- **Claude API:** Process user questions with data context
- **Frontend:** Sidebar chat interface with message history
- **Update frequency:** Real-time (streaming responses)

### 📰 News Aggregation
- **Source 1:** NewsAPI (100 requests/day free, supports Portuguese)
- **Source 2:** RSS feeds from major Brazilian news outlets
- **Processing:** GitHub Actions scheduled job (hourly)
- **Storage:** `news_articles` table with sentiment analysis

### 🚨 Smart Alerts
- **Triggers:** Sentiment drop, volume spike, attack patterns
- **Channels:** Dashboard notification, email, optional webhooks
- **Processing:** Real-time or batch (depends on frequency)

---

## 6. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/socialsense

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# External APIs
NEWSAPI_KEY=your_key...

# Frontend (Vercel)
VITE_API_URL=http://localhost:5000 (dev) or https://api.socialsense.io (prod)

# Optional
SENTRY_DSN=...
```

---

## 7. Deployment Architecture

### Local Development
```
Your Machine
├── Docker: PostgreSQL + pgAdmin
├── Frontend: npm run dev (localhost:3000)
└── Backend: npm/python run server (localhost:5000)
```

### Production
```
GitHub → Actions (CI/CD)
├─→ Frontend: Vercel (automatic deploy)
├─→ Backend: Railway (automatic deploy)
└─→ Database: PostgreSQL on Railway
```

---

## 8. Scalability Considerations

**Phase 1 (MVP):**
- Single backend instance
- PostgreSQL on Railway (5GB free tier)
- GitHub Actions for automation
- Expected: < 1000 users

**Phase 2 (Growth):**
- Add Redis for caching
- Implement database read replicas
- Scale backend horizontally on Railway
- Expected: 1000-10,000 users

**Phase 3 (Scale):**
- CDN for static assets
- Database optimization (indexing)
- Queue system for async processing
- Expected: 10,000+ users

---

## 9. Security Considerations

- **API Keys:** Store in environment variables, never commit
- **Database:** Use Railway's VPC, encrypted connections
- **Authentication:** Implement JWT or session-based auth (Phase 2)
- **Rate Limiting:** Implement on backend to protect Claude API usage
- **LGPD Compliance:** All personal data handling must comply with Brazilian LGPD

---

## 📝 Summary

Social Sense uses a modern, scalable architecture:
- **Frontend:** React deployed on Vercel
- **Backend:** Node/Python deployed on Railway
- **Database:** PostgreSQL (local Docker, production Railway)
- **Automation:** GitHub Actions (no external tools needed)
- **AI:** Claude API for analysis and chat

This keeps costs low, development simple, and deployment straightforward.
