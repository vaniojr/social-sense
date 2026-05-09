# Integrações de API - Social Sense

## Overview

Este documento lista todas as APIs externas que o projeto usa, como integrá-las e em qual fase cada uma entra.

```
Fase 1 (MVP):    News aggregation + Claude API
Fase 2 (Growth): Social Media APIs
Fase 3 (Scale):  Advanced Analytics
```

---

## 0. Social Sense Core Features ⭐

### Geographic Analysis (Built-in with PostgreSQL PostGIS)

**What it is:** Regional sentiment mapping using coordinates from posts/news

**How it works:**
```
1. Extract location from news articles/social posts
2. Store lat/long in database with sentiment score
3. Group by state/region using PostGIS
4. Calculate average sentiment per region
5. Visualize on Brazil heat map
```

**APIs needed:**
- **Location extraction:** Built into social media APIs (Twitter/X, Instagram, TikTok)
- **PostGIS:** Built-in PostgreSQL, no external API needed

**Cost:** R$ 0 (native PostgreSQL feature)

---

### Chat AI Copilot (Claude API)

**What it is:** Natural language interface to query and analyze data

**How it works:**
```
1. User asks: "Where is my competitor growing?"
2. System aggregates relevant data (sentiment, trends, regional scores)
3. Claude receives: question + data context
4. Claude generates insightful answer with reasoning
5. Stream response to user
```

**Example queries:**
- "Em qual região meu concorrente está crescendo?"
- "Quais são os 3 temas trending no Nordeste?"
- "Compare meu sentimento vs concorrente no Sudeste"
- "Qual é a narrativa dominante sobre minha marca?"

**Implementation:**
```typescript
// Backend endpoint: /api/chat
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  system: `You are a political/reputation analysis expert. 
           Analyze the provided data and answer the user's question in Portuguese.
           Be specific, cite numbers, and suggest actions.`,
  messages: [{
    role: "user",
    content: `Data: ${JSON.stringify(aggregatedData)}\nQuestion: ${userQuestion}`
  }]
});
```

**Cost:** ~R$ 0.01 per query (depends on prompt + response length)

---

## 1. News APIs (Fase 1 - MVP)

### NewsAPI

**Purpose:** Agregar notícias políticas de portais brasileiros em tempo real

**Docs:** https://newsapi.org/

**Setup:**
```bash
# 1. Create account at https://newsapi.org
# 2. Copy API key
# 3. Add to .env
NEWSAPI_KEY=abc123...
```

**Endpoint usado:**
```
GET https://newsapi.org/v2/everything
  ?q=<candidate_name>
  &language=pt
  &sortBy=publishedAt
  &apiKey=<sua-key>
```

**Exemplo de uso em GitHub Actions:**
```yaml
# .github/workflows/fetch-news.yml
name: Fetch News
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Fetch and analyze news
        run: |
          python scripts/fetch_news.py
```

**Rate limit:** 100 requests/day (free tier)

**Upgrade:** $45/month para 500/dia

**Alternativas:**
- **Mediastack** (https://mediastack.com/) - 100/mês grátis
- **Bing News Search** - 1000/mês free
- **Portal RSS feeds** - Free, mas setup manual

### Portal RSS Feeds (Fase 1 - Complementar)

**Purpose:** Scrape RSS feeds diretamente de portais brasileiros

**Portais para monitorar:**
- G1 (https://g1.globo.com)
- Folha de S.Paulo (https://www1.folha.uol.com.br)
- O Globo (https://oglobo.globo.com)
- UOL (https://www.uol.com.br)
- Estadão (https://www.estadao.com.br)

**Setup em GitHub Actions:**
```yaml
# Script Python para scraper RSS
import feedparser
import requests

def fetch_rss(url):
    feed = feedparser.parse(url)
    for entry in feed.entries:
        process_article(entry)
```

**Vantagens:**
- Totalmente gratuito
- Sem rate limit
- Mais controle sobre parsing

**Desvantagens:**
- Precisa de scraping
- Menos estruturado que NewsAPI

---

## 2. Claude API (LLM - Fase 1)

### Anthropic Claude

**Purpose:** Análise de sentimento, summarização, geração de insights, chat copilot

**Docs:** https://docs.anthropic.com/

**Setup:**
```bash
# 1. Create account at https://console.anthropic.com
# 2. Create API key
# 3. Add credits ($5+)
ANTHROPIC_API_KEY=sk-ant-...
```

**Modelos recomendados:**

| Modelo | Uso | Custo/1M tokens |
|--------|-----|-----------------|
| `claude-3-5-haiku` | Análise rápida, summaries | $0.80 input, $4 output |
| `claude-3-5-sonnet` | Análise profunda, chat, comparações | $3 input, $15 output |

**Exemplos de implementação:**

#### 1. Sentiment Analysis
```typescript
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 512,
  messages: [{
    role: "user",
    content: `Analyze sentiment of this news article (resposta em JSON):
    
    Title: ${newsTitle}
    Content: ${newsContent}
    
    Return JSON with: sentiment (-1 to 1), confidence, key_themes, suggested_response`
  }]
});
```

#### 2. News Summarization
```typescript
const response = await client.messages.create({
  model: "claude-3-5-haiku",
  max_tokens: 256,
  messages: [{
    role: "user",
    content: `Resuma esta notícia em 100 palavras, destacando o impacto político:\n${newsContent}`
  }]
});
```

#### 3. Comparison Analysis
```typescript
const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Compare o sentimento sobre meu candidato vs meu concorrente:

    Meu candidato:
    ${JSON.stringify(candidateData)}
    
    Concorrente:
    ${JSON.stringify(competitorData)}
    
    Responda em português com análise estratégica.`
  }]
});
```

**Rate limit:** 50 RPM (free tier)

**Pricing:**
- ~R$ 0.003 per 1k input tokens
- ~R$ 0.015 per 1k output tokens
- Estimated: R$ 20-80/month for MVP usage

**Por que Claude?**
- ✅ Excelente reasoning para análise nuançada
- ✅ Suporta streaming (respostas em tempo real)
- ✅ Contexto longo (100k tokens) para análise complexa
- ✅ Português nativo (melhor que OpenAI)
- ✅ Sem preocupação com jailbreak/prompt injection

---

## 3. Social Media APIs (Fase 2+)

### Twitter/X API v2

**Purpose:** Monitorar menções em tempo real, analisar sentimento

**Docs:** https://developer.twitter.com/en/docs/twitter-api

**Setup:**
```bash
# 1. Create account at https://developer.twitter.com
# 2. Request API v2 access
# 3. Create new app
# 4. Generate Bearer Token
TWITTER_API_KEY=your_bearer_token
```

**Endpoint principal:**
```
GET /2/tweets/search/recent
  ?query=candidate_name
  &max_results=100
  &tweet.fields=author_id,created_at,public_metrics,geo
```

**Rate limit:** 300 requests/15min (free tier)

**Upgrade:** $100-$500/month for premium access

### Instagram Business API

**Purpose:** Monitorar comentários, hashtags, menções

**Docs:** https://developers.facebook.com/docs/instagram

**Setup:**
```bash
# 1. Configure App at Meta Developers
# 2. Link Instagram Business Account
# 3. Generate Access Token
INSTAGRAM_ACCESS_TOKEN=your_token
```

**Rate limit:** 200 calls/hour (free tier)

### TikTok API

**Purpose:** Monitorar tendências, conteúdo viral

**Docs:** https://developers.tiktok.com/doc/

**Setup:**
```bash
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
```

---

## 4. External Services (Fase 2+)

### Sentry (Error Tracking)

**Purpose:** Monitor erros em produção

**Setup:**
```bash
# 1. Create account at https://sentry.io
# 2. Create project
SENTRY_DSN=your_dsn
```

**Cost:** Free tier (5k events/month)

### SendGrid (Email Alerts - Optional)

**Purpose:** Enviar alertas por email

**Setup:**
```bash
# 1. Create account at https://sendgrid.com
# 2. Create API key
SENDGRID_API_KEY=SG.xxx
```

**Cost:** Free tier (100 emails/day)

---

## 5. Environment Variables (Complete)

```env
# === FASE 1 (MVP) ===

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/socialsense

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# News
NEWSAPI_KEY=your_key

# Frontend
VITE_API_URL=http://localhost:5000

# === FASE 2 (Growth) ===

# Social Media APIs
TWITTER_API_KEY=your_bearer_token
INSTAGRAM_ACCESS_TOKEN=your_token
TIKTOK_CLIENT_KEY=your_key
TIKTOK_CLIENT_SECRET=your_secret

# Email & Monitoring
SENDGRID_API_KEY=SG.xxx
SENTRY_DSN=your_dsn

# === FASE 3 (Scale) ===

# Advanced Services (future)
GOOGLE_CLOUD_PROJECT_ID=your_project
AZURE_CONTENT_MOD_KEY=your_key
```

---

## 6. API Costs Summary

| API | Purpose | Phase | Cost/mês |
|-----|---------|-------|----------|
| NewsAPI | News aggregation | 1 | $0–45 |
| Claude API | Analysis + Chat | 1 | $20–80 |
| Twitter/X | Monitoring | 2 | $0–100 |
| Instagram | Comments | 2 | $0 |
| TikTok | Trends | 2 | $0 |
| SendGrid | Email alerts | 2 | $0–30 |
| Sentry | Error tracking | 2 | $0 |
| **TOTAL** | | | **$20–255** |

Note: Escalates with usage. First paying customers cover costs.

---

## 7. Testing APIs Locally

### Test NewsAPI
```bash
curl "https://newsapi.org/v2/everything?q=Lula&language=pt&apiKey=$NEWSAPI_KEY"
```

### Test Claude API
```bash
python3 << 'EOF'
import anthropic

client = anthropic.Anthropic(api_key="sk-ant-...")

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, what is your name?"}
    ]
)

print(message.content[0].text)
EOF
```

### Test PostgreSQL Connection
```bash
psql -h localhost -U postgres -d socialsense -c "SELECT 1;"
```

---

## 8. Troubleshooting

**API Key inválida:**
```bash
# Verify key format
echo $ANTHROPIC_API_KEY  # Should start with sk-ant-
```

**Rate limit atingido:**
```typescript
// Implement exponential backoff
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) { // Too Many Requests
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}
```

**Connection refused (local database):**
```bash
# Make sure docker-compose is running
docker-compose ps
docker-compose up -d
```

---

## 📝 Next Steps

1. **Fase 1:** Setup NewsAPI + Claude API
2. **Fase 2:** Add social media monitoring
3. **Fase 3:** Implement advanced analytics

See [SETUP_LOCAL.md](SETUP_LOCAL.md) for detailed setup instructions.
