# Design do Produto - Social Sense (Plataforma Multi-Vertical de Reputação)

## 1. Visão do Produto

**Social Sense** é um **dashboard inteligente em tempo real** que permite políticos, influencers, brands e celebridades monitorarem sua reputação digital, detectarem crises em tempo real e gerarem insights estratégicos automaticamente via IA.

**Agnóstico de vertical:** funciona para **política, influencers, brands e celebridades**.

## 2. Usuários-Alvo (Multi-Vertical)

### Vertical 1: Política (High-value + Seasonal)
- **Agências políticas:** gerenciam múltiplos candidatos (Ticket: R$5k-20k/mês)
- **Campanhas médias/grandes:** R$ 50k+/mês de orçamento (Ticket: R$2k-5k/mês)
- **Partidos/Diretórios:** monitora múltiplos candidatos regionalmente (Ticket: R$10k-30k/mês)
- **Assessorias de campanha:** equipes de marketing político (Ticket: R$3k-8k/mês)

### Vertical 2: Influencers (High-value + Recurring)
- **Agências de influencers:** gerenciam 10-100+ influenciadores (Ticket: R$5k-25k/mês - MAIOR LTV)
- **Influencers individualmente:** 100k+ followers monitoram reputação (Ticket: R$500-2k/mês)
- **Gerenciadores de celebridades:** protegem reputação online (Ticket: R$3k-15k/mês)
- **Talent managers:** múltiplos talentos/artistas (Ticket: R$5k-20k/mês)

### Vertical 3: Brands (High-value + Evergreen)
- **Agências de marketing:** monitoram marcas dos clientes (Ticket: R$3k-10k/mês)
- **Departamentos de crise:** grandes corporações (Ticket: R$5k-20k/mês)
- **Consultores de reputação:** freelancers e agencies (Ticket: R$2k-8k/mês)
- **Startups/scale-ups:** que precisam gerenciar PR (Ticket: R$1k-5k/mês)

### Secondary
- Jornalistas/fact-checkers (monitoramento público)
- Pesquisadores políticos
- Analistas de mercado

## 3. Problemas Resolvidos (Multi-Vertical)

| Problema Político | Problema Influencer | Problema Brand | Solução |
|------|------|------|---------|
| Crise política não detectada | Cancelamento viral não visto | Sentimento de marca cai | Alertas em < 5min |
| Não saber o sentimento dos eleitores | Não entender sentimento da audiência | Ignorar feedback dos clientes | Análise de sentimento real-time |
| Responder lentamente a ataques | Precisa time para responder | Equipe sobrecarregada | Sugestões automáticas de resposta |
| Horas monitorando notícias | Múltiplos influencers = caos | Múltiplas plataformas | Dashboard centralizado |
| Perder para concorrentes | Ignorar o que faz rival crescer | Não entender market share | Análise comparativa automática |
| Perder tendências emergentes | Trends mudam a cada hora | Oportunidades de PR | Detecção de tendências em tempo real |

## 4. Features Principais

### Fase 1 (MVP - 4 semanas)
- [ ] **News Aggregation** - coleta notícias de portais políticos em tempo real
- [ ] **Smart Summarization** - resume notícias com IA
- [ ] **🗺️ Geographic Analysis** - mapa de sentimento por estado/região
- [ ] **Alerts** - notifica sobre menções do candidato
- [ ] **Dashboard Básico** - painel com mapa, notícias, alertas
- [ ] **💬 Chat AI Copilot** - interface conversacional para perguntas (MVP simples)

### Fase 2 (6-8 semanas)
- [ ] **Sentiment Analysis** - analisa sentimento em redes sociais com geographic breakdown
- [ ] **Competitor Tracking** - compara contra concorrentes (com análise regional)
- [ ] **Content Suggestions** - sugere temas para responder (por região)
- [ ] **Trend Detection** - identifica assuntos em alta (agregado + regional)
- [ ] **Chat Copilot Advanced** - queries mais complexas, histórico, contexto

### Fase 3 (War Room - 10-12 semanas)
- [ ] **Real-time Dashboard** - mapa de sentimento por cidade/tema
- [ ] **Coordinated Attack Detection** - identifica campanhas coordenadas
- [ ] **Performance Analytics** - performance de vídeos/posts
- [ ] **Action Recommendations** - IA sugere ações ("grave vídeo sobre X HOJE")

## 5. Estrutura do Painel

```
Dashboard
├── Home
│   ├── Resumo executivo (últimas 24h)
│   ├── Alertas críticos
│   ├── Métricas principais
│   └── 🗺️ Mini mapa de sentimento (visão geral regional)
│
├── 🗺️ Mapa Regional (NEW - Feature #1)
│   ├── Heat map Brasil (sentimento por estado)
│   ├── Ranking: Estados com melhor/pior sentimento
│   ├── Top 5 temas por região
│   └── Ações sugeridas por região
│
├── Monitoramento
│   ├── Notícias em tempo real
│   ├── Redes sociais (feed agregado)
│   ├── Sentimento (gráfico por tema)
│   └── Filtrável por região
│
├── Análise
│   ├── Comparação contra concorrentes (com breakdown regional)
│   ├── Temas em alta (agregado + por região)
│   └── Padrões de ataque
│
├── 💬 Chat IA (NEW - Feature #2)
│   ├── Interface conversacional na sidebar
│   ├── Histórico de conversas
│   └── Exemplos de queries úteis
│
├── Ações
│   ├── Sugestões de resposta (por região)
│   ├── Conteúdo automático sugerido
│   └── Histórico de ações tomadas
│
└── Configurações
    ├── Candidatos/temas monitorados
    ├── Canais (redes sociais, news)
    ├── Regiões de foco
    └── Alertas e notificações
```

## 6. Modelo de Dados Simplificado

```
Candidates
├── name
├── party
├── region
└── created_at

Monitoring Topics
├── candidate_id
├── topic (string)
├── active (bool)
└── keywords (array)

News Items
├── candidate_id
├── title
├── content
├── source
├── sentiment (positive/neutral/negative)
├── url
├── published_at
└── created_at

Alerts
├── candidate_id
├── type (news, social, attack, trend)
├── severity (low/medium/high/critical)
├── title
├── description
├── action_taken (bool)
└── created_at

Sentiment Scores
├── candidate_id
├── topic
├── score (-1 to +1)
├── volume (número de menções)
├── source (social media, news)
└── timestamp
```

## 7. Fluxos Principais

### Fluxo 1: News Monitoring
```
n8n: Coleta notícias → Supabase: Armazena → Claude API: Analisa + Resume
→ Dashboard: Exibe → Alert Engine: Se crítico → Notifica usuário
```

### Fluxo 2: Sentiment Analysis
```
n8n: Scrapa redes sociais → Claude: Analisa sentimento → Supabase: Armazena scores
→ Dashboard: Visualiza gráfico → Detecta picos → Gera alerta
```

### Fluxo 3: Competitor Tracking
```
n8n: Coleta dados do concorrente → Claude: Compara métricas
→ Dashboard: Mostra comparação lado-a-lado
```

## 8. User Stories Prioritizadas (Multi-Vertical)

### P0 (Essencial - MVP) - Agnóstico
- Como [persona], quero **receber alerta quando [meu nome/brand/influencer] aparece em destaque**
- Como [persona], quero **ver todas as menções sobre [mim/minha marca] em um lugar centralizado**
- Como [persona], quero **entender rapidamente o resumo do conteúdo mencionado**
- Como [persona], quero **ver um mapa mostrando onde estou sendo mais mencionado (por região/estado)** ⭐
- Como [persona], quero **fazer perguntas em linguagem natural sobre meus dados** ("Onde meu concorrente está crescendo?") ⭐

**Específico por vertical:**
- **Político:** receber alerta de notícia sobre candidato + saber em qual estado tenho melhor sentimento
- **Influencer:** receber alerta de tweet viralizando + ver em qual região tenho mais engagement
- **Brand:** receber alerta de review negativo + entender qual região está insatisfeita

### P1 (Importante - Fase 2) - Por Vertical
- Como **agência política**, quero **saber em qual estado/região meu candidato tem melhor/pior sentimento**
- Como **agência de influencers**, quero **comparar engajamento de múltiplos influenciadores por região**
- Como **brand manager**, quero **comparar sentimento da minha marca vs concorrentes em cada região**
- Como **agência política**, quero **fazer perguntas tipo "Quais são os 3 temas trending no Nordeste?" diretamente no chat**
- Como qualquer um, quero **saber que temas/assuntos estão em alta para eu responder (por região)**
- Como qualquer um, quero **detectar campanhas coordenadas contra mim**

### P2 (Legal - Fase 3) - Premium
- Como [persona], quero **sugestões de conteúdo específicas por região** ("Grave vídeo sobre saúde para Nordeste")
- Como [persona], quero **receber sugestão automática de resposta para uma crise (com contexto regional)**
- Como **influencer**, quero **sugestão de tema trending para criar conteúdo (por região onde tenho mais audiência)**
- Como **brand**, quero **análise de sentimento por demographic + region (idade + localização)**
- Como **chat user**, quero **fazer análises complexas**: "Compare sentiment de meus 3 concorrentes no Sudeste vs Nordeste nos últimos 7 dias"

## 9. Critérios de Sucesso (MVP)

- ✅ Notícias coletadas em <5 minutos após publicação
- ✅ Alertas entregues em <2 minutos
- ✅ 95%+ de acurácia em resumos
- ✅ Dashboard carrega em <2 segundos
- ✅ Primeiro cliente pagando

## 10. Compliance & Ética

- ✅ Nenhuma geração de deepfakes ou fake news
- ✅ Nenhuma automação enganosa (sempre deixar claro que é IA)
- ✅ LGPD compliant (dados do eleitor)
- ✅ Transparência sobre análise de IA

## 11. Precificação (Proposta Multi-Vertical)

### Política
| Tier | Personas | Preço/mês |
|------|----------|-----------|
| Starter | 1 candidato | R$ 800 |
| Professional | 3 candidatos | R$ 2,500 |
| Agency | 10-50 candidatos | R$ 8,000–20,000 |

### Influencers (MAIS LUCRATIVO)
| Tier | Personas | Preço/mês |
|------|----------|-----------|
| Starter | 1 influencer | R$ 500 |
| Professional | 5 influencers | R$ 2,000 |
| **Agency** | **10-100+ influencers** | **R$ 10,000–25,000** ⭐ |

### Brands
| Tier | Personas | Preço/mês |
|------|----------|-----------|
| Starter | 1 brand | R$ 1,500 |
| Professional | 3 brands | R$ 4,000 |
| Enterprise | Ilimitado | R$ 15,000–50,000 |

### White-label (Resellers)
| Opção | Preço |
|-------|-------|
| Agências políticas revendem | Negociado (marcar 50-100%) |
| Agências de influencers revendem | Negociado (marcar 50-100%) |
| Consultores incluem em pacotes | Customizado |

**Nota:** Influencers agencies têm MAIOR LTV (lifetime value) pois:
- Recorrência: 365 dias/ano vs 4 meses (política)
- Múltiplas personas: uma agência gerencia 10-100+
- Menos rotatividade: influencers duram anos vs campanha acaba

## 12. GTM (Go-to-Market) - Multi-Vertical Strategy

### Fase 1 (Ago-Set 2026): MVP Política + MVP Influencers
**Timing:** Aproveita período eleitoral BR + crescimento de influencers
- Validação com 3-5 agências políticas (piloto)
- Validação com 3-5 agências de influencers (piloto paralelo)
- Lançamento: Feature parity entre verticais
- Objetivo: 10-15 clientes pagando

### Fase 2 (Out-Nov 2026): Expansão + Otimização
- Lançamento beta com 20-30 campanhas políticas (usar eleições)
- Lançamento beta com 10-20 agências de influencers
- Adicionar vertical Brands (menor mercado inicial)
- Objetivo: 30-50 clientes

### Fase 3 (Dez 2026-Jan 2027): B2B Estruturado
- Vendas diretas para agências políticas (pós-eleição, preparo para 2028)
- Vendas diretas para agências de influencers (mercado evergreen)
- Lançamento de vendas para Brands
- Objetivo: 100+ clientes

### Fase 4 (Feb 2027+): White-label + Escalabilidade
- White-label para agências políticas grandes
- White-label para agências de influencers
- White-label para consultores de crise
- Objetivo: Escalar via partners, reduzir CAC

**Insight financeiro:**
```
Política (4 meses):       5 clientes × R$10k = R$50k/mês (8 meses)
Influencers (12 meses):   5 clientes × R$15k = R$75k/mês (permanente)
Brands (12 meses):        3 clientes × R$8k = R$24k/mês (permanente)

MRR ao final Fase 1: ~R$30k
MRR ao final Fase 3: ~R$150k+
```
