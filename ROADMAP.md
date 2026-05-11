# 🚀 Roadmap Social Sense - Etapas Pendentes

**Status Atual:** MVP Fase 1 - 85% completo  
**Data:** 2026-05-11  
**Responsável:** Desenvolvimento

---

## 📊 Visão Geral

```
Fase 1 (MVP)         [██████████████████░] 85%
Fase 2 (Advanced)    [░░░░░░░░░░░░░░░░░░] 0%
Fase 3 (War Room)    [░░░░░░░░░░░░░░░░░░] 0%
Deploy/Produção      [░░░░░░░░░░░░░░░░░░] 0%
```

---

## ✅ O Que Já Foi Feito (MVP Fase 1)

### Frontend
- ✅ Estrutura React com React Router v7
- ✅ Dashboard principal com 4 KPI cards
- ✅ Mapa interativo (BrazilMap component) - 27 estados com cores por sentimento
- ✅ Ranking table de estados
- ✅ Context API (EntityContext) para gerenciar entidades globalmente
- ✅ Navegação entre páginas (Dashboard / Geo Analysis)
- ✅ Seletor de entidades no header
- ✅ Styling com Tailwind CSS
- ✅ TypeScript strict mode
- ✅ Zero console errors
- ✅ **Chat Widget (Bloco A)** - Interface de chat com floating button, historico de mensagens, quick prompts
- ✅ **GeoAnalysis Page** - Análise geográfica com mapa regional interativo
- ✅ **Real-time Polling** - 30-segundo polling em Dashboard e GeoAnalysis
- ✅ **Local GeoJSON Storage** - Fallback para carregamento offline do mapa Brasil

### Backend
- ✅ Express API em TypeScript (ES modules)
- ✅ PostgreSQL com schema refatorado (entity/type)
- ✅ Endpoint `/api/entities` (lista 4 entidades: 2 politicians, 1 influencer, 1 brand)
- ✅ Endpoint `/api/geo/regional-sentiment` (retorna 27 estados com sentimento)
- ✅ CORS configurado
- ✅ Database seeding com dados mock
- ✅ Error handling middleware
- ✅ Health check endpoint
- ✅ **Chat Integration (Bloco A)** - POST `/api/chat` com Claude API e persistência de chat_conversations
- ✅ **News Aggregation (Bloco B)** - POST `/api/news/fetch` com NewsAPI + GitHub Actions cron job
- ✅ **Sentiment Analysis (Bloco C)** - 2-stage sentiment analysis com chain-of-thought reasoning
- ✅ **Alerts System (Bloco C)** - Detecção de crises com alertas armazenados e exibidos no frontend
- ✅ **Regional Sentiment Auto-aggregation** - Agrega dados sentiment_scores → regional_sentiment_aggregated

### Documentação
- ✅ CLAUDE.md atualizado
- ✅ DESIGN.md completo
- ✅ ARCHITECTURE.md descrito
- ✅ QA_VALIDATION_REPORT.md
- ✅ Estrutura de docs organizada

### Infraestrutura
- ✅ Docker Compose local (PostgreSQL)
- ✅ Git repository com history
- ✅ .gitignore configurado
- ✅ Environment variables exemplo

---

## ⏳ Próximas Etapas (Em Ordem de Prioridade)

### 🎯 FASE 1 MVP - COMPLETAR (Semanas 1-4)

#### Bloco A: Chat AI Copilot ✅ COMPLETO
**Prioridade:** 🟢 CONCLUÍDO  
**Impacto:** Alta visibilidade, core differentiator

**Tarefas:**
1. ✅ **Criar componente Chat Interface**
   - ✅ Sidebar conversacional fixa
   - ✅ Input box + send button
   - ✅ Message history display
   - ✅ Exemplos de queries pré-definidas

2. ✅ **Integrar Claude API**
   - ✅ Setup chamadas à API Claude
   - ✅ Implementar context window (últimas 5 mensagens)
   - ✅ Tratar erros de rate limit
   - ✅ Add timeout de 30s

3. ✅ **Backend: Chat Endpoint**
   - ✅ `POST /api/chat` - processa query do usuário
   - ✅ Formata contexto (entidade selecionada, dados atuais)
   - ✅ Chamada ao Claude API
   - ✅ Retorna resposta estruturada

4. ✅ **Database: Chat History**
   - ✅ Tabela `chat_conversations` (entity_id, user_id, messages, created_at)
   - ✅ Persistir histórico de conversas

**Status:** Concluído em 2026-05-11

---

#### Bloco B: News Aggregation ✅ COMPLETO
**Prioridade:** 🟢 CONCLUÍDO  
**Impacto:** Alimenta alertas e análise

**Tarefas:**
1. ✅ **NewsAPI Integration**
   - ✅ Setup NewsAPI (https://newsapi.org)
   - ✅ Criar Python script: `scripts/scrape_news.py`
   - ✅ Buscar por entidade (Lula, Bolsonaro, Neymar Jr, Natura)
   - ✅ Filtrar por país (Brazil) + idioma (Portuguese)
   - ✅ Limitar a últimas 24h

2. ✅ **Backend: News Endpoint**
   - ✅ `POST /api/news/fetch` - busca e armazena notícias
   - ✅ `GET /api/news?entityId=<id>&days=7` - retorna artigos
   - ✅ Ordenação por relevância/data

3. ✅ **Database: News Table**
   - ✅ `news_articles` table com todas as colunas
   - ✅ `sentiment_scores` table para armazenar análises
   - ✅ Índices em entity_id + published_at

4. ✅ **Automation: GitHub Actions**
   - ✅ Cron job: executa a cada 30min
   - ✅ Atualiza DB com novos artigos
   - ✅ Processa sentimento automaticamente

**Status:** Concluído em 2026-05-11

---

#### Bloco C: Sentiment Analysis + Alerts ✅ COMPLETO
**Prioridade:** 🟢 CONCLUÍDO  
**Impacto:** Core feature do MVP

**Tarefas:**
1. ✅ **Sentiment Scoring**
   - ✅ 2-stage sentiment analysis com chain-of-thought
   - ✅ Stage 1: Identifica direção (POSITIVO/NEGATIVO/NEUTRO)
   - ✅ Stage 2: Quantifica intensidade (-1.0 a +1.0)
   - ✅ Extrai temas principais e região/estado
   - ✅ Usa Claude Sonnet para melhor reasoning

2. ✅ **Backend: Sentiment Endpoint**
   - ✅ `GET /api/sentiment?entityId=<id>&days=7`
   - ✅ Retorna agregação por tema, região, timeline
   - ✅ Cálculo de média, picos, tendências

3. ✅ **Alerts System**
   - ✅ Tabela `alerts` (entity_id, type, severity, title, description, created_at)
   - ✅ Regras implementadas:
     - ✅ Sentimento cai > 0.2 em 1h → Alert "Atenção"
     - ✅ Sentimento < -0.5 em qualquer estado → Alert "Crítico"
     - ✅ > 1000 menções em 1h → Alert "Volume Alto"
   - ✅ Persistir alertas para dashboard

4. ✅ **Frontend: Alerts Panel**
   - ✅ Mostrar últimos 5 alertas com cores (🟢 info, 🟡 attention, 🔴 critical)
   - ✅ Timestamps relativos (2m atrás, 1h atrás)
   - ✅ Click para expandir detalhes

**Status:** Concluído em 2026-05-11

---

#### Bloco D: Monitoring Page ✅ COMPLETO
**Prioridade:** 🟢 CONCLUÍDO  
**Impacto:** Página central de monitoramento

**Tarefas:**
1. ✅ **Criar página `/monitor`**
   - ✅ Feed de notícias em tempo real (últimas 50)
   - ✅ Filtros por: data, source, sentiment, região
   - ✅ Indicador visual de sentimento

2. ✅ **News List Component**
   - ✅ Exibir título, fonte, data, snippet, sentimento
   - ✅ Hover mostra tema principal extraído
   - ✅ Click abre URL no novo aba

3. ✅ **Timeline Visualization**
   - ✅ Gráfico de sentimento vs. tempo (últimos 7 dias)
   - ✅ Biblioteca: Recharts (já instalado)
   - ✅ Area chart com cores por sentimento

**Status:** Concluído em 2026-05-11

---

#### Bloco E: Configurações de Entidades (Semana 3-4)
**Prioridade:** 🟡 MÉDIA  
**Impacto:** Permite customização

**Tarefas:**
1. [ ] **Criar página `/settings`**
   - Gerenciar entidades monitoradas
   - Configurar temas de interesse (keywords)
   - Regiões prioritárias
   - Preferências de alertas

2. [ ] **Backend: Settings Endpoints**
   - `PUT /api/entities/:id` - atualizar entidade
   - `POST /api/entities/:id/keywords` - adicionar keywords
   - `GET /api/entities/:id/config` - retorna configuração

3. [ ] **Validação & Constraints**
   - Max 100 keywords por entidade
   - Regiões devem ser válidas (27 estados + agregações)

**Estimativa:** 1.5 dias (8h implementation)

---

**🎯 FIM DA FASE 1 MVP: Quando todas as etapas A-E estarem 100% testadas**

---

### 🎯 FASE 2 - ADVANCED (Semanas 5-8)

#### Bloco F: Competitor Tracking
**Tarefas:**
1. [ ] Buscar múltiplas entidades simultaneamente
2. [ ] Comparação gráfica de sentimentos
3. [ ] Analise por região: "Onde eu ganho/perco vs. concorrente"
4. [ ] Tema comparative: "Qual tema favorece meu competitor"

**Estimativa:** 2 dias

---

#### Bloco G: Trend Detection
**Tarefas:**
1. [ ] Identificar temas em alta (volume + sentimento crescente)
2. [ ] Score de oportunidade (tema + baixa menção = oportunidade de PR)
3. [ ] Sugestões regionais de temas a responder

**Estimativa:** 2 dias

---

#### Bloco H: Advanced Chat Features
**Tarefas:**
1. [ ] Queries complexas com contexto histórico
2. [ ] Sugestões automáticas de follow-ups
3. [ ] Export de conversas (PDF)

**Estimativa:** 1.5 dias

---

### 🎯 FASE 3 - WAR ROOM (Semanas 9-12)

#### Bloco I: Real-time Updates (WebSocket)
#### Bloco J: Coordinated Attack Detection
#### Bloco K: Performance Analytics
#### Bloco L: Action Recommendations

---

### 🌍 FASE 4 - DEPLOY & PRODUÇÃO (Semanas 13-14)

#### Bloco M: Deploy Frontend (Vercel)
**Tarefas:**
1. [ ] Setup Vercel CLI
2. [ ] Conectar GitHub repository
3. [ ] Configure environment variables (VITE_API_URL)
4. [ ] Deploy automático em push para main

**Estimativa:** 2h

---

#### Bloco N: Deploy Backend (Railway)
**Tarefas:**
1. [ ] Setup Railway account
2. [ ] Conectar GitHub repository
3. [ ] Configure variables de ambiente
4. [ ] Database PostgreSQL em Railway
5. [ ] Deploy automático

**Estimativa:** 3h

---

#### Bloco O: Email Setup (Zoho Mail)
**Tarefas:**
1. [ ] Configurar hello@socialsense.io
2. [ ] SMTP credenciais
3. [ ] Envio de alertas por email
4. [ ] Recuperação de senha

**Estimativa:** 2h

---

#### Bloco P: GitHub Actions CI/CD
**Tarefas:**
1. [ ] Criar workflow: test + lint
2. [ ] Criar workflow: deploy to Vercel + Railway
3. [ ] Criar workflow: news scraping job (cron)

**Estimativa:** 2h

---

#### Bloco Q: DNS & Domain (Cloudflare)
**Tarefas:**
1. [ ] Transferir domínio para Cloudflare Registrar
2. [ ] Setup DNS records
3. [ ] HTTPS certificate

**Estimativa:** 1h

---

## 📋 Ordem Recomendada (Mapa Crítico)

### Semana 1: Chat + News Foundation
```
Segunda:    Bloco A (Chat Interface + Claude integration)
Quarta:     Bloco B.1-2 (NewsAPI + scrape script)
Sexta:      Testing + bugfixes
```

### Semana 2: Sentiment + Alerts
```
Segunda:    Bloco C.1-2 (Sentiment scoring + backend endpoint)
Quarta:     Bloco C.3-4 (Alerts system + frontend)
Sexta:      Testing + QA validation
```

### Semana 3: Monitoring + Settings
```
Segunda:    Bloco D (Monitoring page + components)
Quarta:     Bloco E.1-2 (Settings page + backend)
Sexta:      Polish + testing
```

### Semana 4: Phase 1 Final
```
Segunda-Quarta:  Bugfixes, edge cases, UX polish
Quinta:          Final QA validation
Sexta:           Deploy to staging
```

---

## 🎨 Diagrama de Dependências

```
MVP Phase 1 Complete
├── A. Chat Interface ✅ COMPLETO (2026-05-11)
│   └── Needs: Claude API key, Backend chat endpoint
├── B. News Aggregation ✅ COMPLETO (2026-05-11)
│   └── Needs: NewsAPI key, Scraper script
├── C. Sentiment Analysis ✅ COMPLETO (2026-05-11)
│   ├── Depends on: B (news to analyze)
│   └── Needs: Claude API, Database table
├── D. Monitoring Page ✅ COMPLETO (2026-05-11)
│   ├── Depends on: B, C (needs news + sentiment)
│   └── Needs: Frontend components
└── E. Settings ⏳ EM ANDAMENTO
    ├── Depends on: A (entity management)
    └── Needs: Backend endpoints

Deploy Phase
├── M. Vercel (Frontend)
├── N. Railway (Backend + DB)
├── O. Zoho Mail
├── P. GitHub Actions
└── Q. DNS/Cloudflare
```

---

## 🔑 Environment Variables Necessárias

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5001  # dev: local, prod: railway-url
```

### Backend (.env)
```
PORT=5001
DATABASE_URL=postgresql://user:pass@localhost:5432/social_sense
CLAUDE_API_KEY=sk-ant-...
NEWSAPI_KEY=abc123...
NODE_ENV=development
```

---

## 📈 Métricas de Sucesso

- [ ] MVP Phase 1: Todas 5 features funcionando sem erros
- [ ] Chat: Mínimo 5 queries diferentes testadas e respondidas corretamente
- [ ] News: Mínimo 50 artigos agregados em 24h para cada entidade
- [ ] Alerts: Mínimo 3 alertas gerados corretamente
- [ ] Performance: Dashboard carrega em <2s, Chat responde em <5s
- [ ] Frontend: Zero console errors, 100% TS compilation
- [ ] Backend: All endpoints tested, API response <200ms

---

## 🚨 Riscos & Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|-----------|
| Claude API rate limits | Alta | Alto | Implementar cache, queue de requests |
| NewsAPI returns incomplete data | Média | Médio | Fallback sources (RSS feeds) |
| GeoJSON não carrega | Baixa | Alto | Cache local, fallback dataset |
| Database crescimento | Média | Médio | Implementar retention policy (30 dias) |
| Deployment issues | Média | Alto | Test in staging, rollback strategy |

---

## ✅ Checklist Final (Before Go-Live)

- [ ] MVP Phase 1 completa (5/5 features)
- [ ] QA validation report atualizado
- [ ] All API endpoints documented
- [ ] Database backups configurados
- [ ] Error logging (Sentry) configurado
- [ ] SSL certificates validos
- [ ] CORS configurado apenas para domínios autorizados
- [ ] Rate limiting ativado
- [ ] Monitoring & alertas de sistema em produção

---

**Próximo review:** 2026-05-18 (final da Semana 2)  
**Target MVP go-live:** 2026-05-25
