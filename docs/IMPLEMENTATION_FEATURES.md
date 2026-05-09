# Implementação das 2 Features Principais

## Overview

Este documento detalha a implementação técnica das 2 features principais:
1. **Geographic Analysis** (Análise de Sentimento por Região)
2. **Chat AI Copilot** (Interface Conversacional com IA)

---

## 🗺️ Feature 1: Geographic Analysis

### Objetivo
Permitir que usuários vejam um mapa do Brasil com sentimento agregado por estado/região em tempo real.

### User Stories
- "Quero ver qual região tenho melhor/pior sentimento"
- "Quero saber os top 5 temas por região para responder regionalmente"
- "Quero comparar meu sentimento no Sudeste vs meu concorrente"

### Arquitetura Técnica

#### 1.1 Database Schema

```sql
-- Regional Sentiment Scores
CREATE TABLE regional_sentiment_scores (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES candidates,
  region VARCHAR(50), -- 'North', 'Northeast', 'Southeast', 'South', 'Center-West'
  state_code VARCHAR(2), -- 'SP', 'RJ', 'MG', etc
  state_name VARCHAR(50), -- 'São Paulo', 'Rio de Janeiro'
  latitude DECIMAL,
  longitude DECIMAL,
  sentiment_score DECIMAL(-1 to 1), -- -1 (very negative) to +1 (very positive)
  volume INTEGER, -- number of mentions
  top_themes TEXT[], -- ['tema1', 'tema2', 'tema3']
  top_themes_sentiment JSONB, -- {tema1: +0.3, tema2: -0.1}
  timestamp TIMESTAMP,
  created_at TIMESTAMP
);

-- Index for fast queries
CREATE INDEX idx_regional_sentiment_candidate_timestamp 
  ON regional_sentiment_scores(candidate_id, timestamp DESC);
```

#### 1.2 Data Flow

```
Step 1: Collect posts with location
├─ Twitter posts (user.location, place.geo)
├─ Instagram posts (location tag, caption mentions)
└─ News articles (published region)

Step 2: Analyze sentiment + Extract location
├─ Claude API: Analyze sentiment
├─ Extract coordinates (lat/long) from location string
└─ Geocode if needed (Google Geocoding API or PostGIS)

Step 3: Aggregate by region
├─ GROUP BY state_code
├─ AVG(sentiment_score) → regional_score
├─ COUNT(*) → volume
└─ Top 5 themes via NLP

Step 4: Store in regional_sentiment_scores
├─ Save calculated scores
├─ Add theme breakdown
└─ Timestamp each entry

Step 5: Real-time update dashboard
├─ Supabase Realtime subscription to regional_sentiment_scores
├─ Frontend receives updates < 1 sec
└─ Heat map redraws
```

#### 1.3 API Endpoint

```typescript
// POST /api/regional-sentiment
// Purpose: Get regional sentiment breakdown

export async function POST(req: Request) {
  const { candidate_id, days = 7 } = await req.json();
  
  // Query regional scores from past N days
  const { data: regionalScores } = await supabase
    .from('regional_sentiment_scores')
    .select('*')
    .eq('candidate_id', candidate_id)
    .gte('created_at', new Date(Date.now() - days * 86400000))
    .order('timestamp', { ascending: false });
  
  // Calculate aggregated regional scores
  const aggregated = aggregateByRegion(regionalScores);
  
  return Response.json({
    regional_scores: aggregated,
    best_region: findBestRegion(aggregated),
    worst_region: findWorstRegion(aggregated),
    timestamp: new Date()
  });
}

// Helper: Aggregate scores by state
function aggregateByRegion(scores) {
  return Object.groupBy(scores, s => s.state_code).map(([state, items]) => ({
    state_code: state,
    state_name: items[0].state_name,
    region: items[0].region,
    sentiment_score: avg(items.map(i => i.sentiment_score)),
    volume: sum(items.map(i => i.volume)),
    top_themes: getMostFrequentThemes(items, 5)
  }));
}
```

#### 1.4 Frontend Components

**Component 1: Brazil Interactive Choropleth Map (Leaflet + OpenStreetMap)**

**Status:** ✅ IMPLEMENTADO (Phase 2 MVP)

**Biblioteca:** react-leaflet v4 + leaflet + OpenStreetMap tiles

**Arquivo:** `src/frontend/src/components/BrazilMap.tsx`

**Funcionalidades:**
- Mapa geográfico interativo com OpenStreetMap como base
- GeoJSON dos 27 estados brasileiros (IBGE dataset)
- Choropleth: cada estado colorido por sentimento (-1 vermelho → +1 verde)
- Escala de cores: 5 níveis (muito negativo → muito positivo)
- Interatividade:
  - **Hover:** destaca estado com borda azul
  - **Click:** seleciona estado, mostra painel de detalhes
  - **Popup:** tooltip com sentimento, volume de menções, temas
- Zoom e pan para navegação do mapa
- Legenda visual integrada

```tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';

export function BrazilMap({ states, onStateClick, selectedState }) {
  // Renderiza mapa com MapContainer
  // Carrega GeoJSON de https://raw.githubusercontent.com/fititnt/gis-dataset-brasil/master/uf/geojson/uf.json
  // Colors states based on sentiment score
  // Height: 500px, Zoom: 4, Centered on Brazil [-10.3, -55.5]
  
  return (
    <MapContainer center={[-10.3, -55.5]} zoom={4} style={{ width: '100%', height: '500px' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={geoJsonData} style={style} onEachFeature={onEachFeature} />
    </MapContainer>
  );
}
```

**Dependências:**
- `react-leaflet@^4.0.0`
- `leaflet@^1.9.0`
- PostCSS + Tailwind CSS (para styling)

**Performance:**
- GeoJSON carregado uma única vez ao montar o componente
- Memoization do stateMap para evitar re-renders
- Otimizado para 27 features (estados)

---

**Component 2: Regional Ranking Table**

**Status:** ✅ IMPLEMENTADO (Phase 2 MVP)

**Arquivo:** `src/frontend/src/components/StateRankingTable.tsx`

```tsx
export function StateRankingTable({ states, onStateClick, selectedState }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>#</th>
          <th>Estado</th>
          <th>Região</th>
          <th>Sentimento</th>
          <th>Menções</th>
          <th>Temas Principais</th>
        </tr>
      </thead>
      <tbody>
        {sortedStates.map((state, index) => (
          <tr key={state.state_code} onClick={() => onStateClick(state.state_code)}>
            <td>{index + 1}</td>
            <td>{state.state_name} ({state.state_code})</td>
            <td>{state.region}</td>
            <td>
              <span className={getSentimentBadgeColor(state.avg_sentiment)}>
                {getSentimentIcon(state.avg_sentiment)} {state.avg_sentiment}
              </span>
            </td>
            <td>{state.mention_volume.toLocaleString('pt-BR')}</td>
            <td>{state.top_themes.slice(0, 3).map(t => <span key={t}>{t}</span>)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Funcionalidades:**
- Tabela com 27 estados ordenados por sentimento (descendente)
- Badges coloridas por sentimento com ícones (📈 📉 ➡️)
- Click em linha = seleciona estado e sincroniza com mapa
- Highlight de linha selecionada
- Localização de números em português
- Exibe top 3 temas por estado
- Responsive com scroll horizontal em mobile

---

**Component 3: GeoAnalysis Page**

**Status:** ✅ IMPLEMENTADO (Phase 2 MVP)

**Arquivo:** `src/frontend/src/pages/GeoAnalysis.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Análise Geográfica  [Candidato Dropdown]                       │
├──────────────────────────┬──────────────────────────────────────┤
│   BrazilMap (2/3)        │  Estatísticas (1/3)                  │
│   (Leaflet + OSM)        │  ✅ Best State (Verde)               │
│   500px height           │  ❌ Worst State (Vermelho)           │
│   Zoom 4                 │  Selecionado: Detalhes               │
│                          │  (Sentimento, Tema, Menções)         │
├──────────────────────────┴──────────────────────────────────────┤
│  StateRankingTable (Full Width)                                  │
│  27 estados, ordenado por sentimento, clicável                   │
└──────────────────────────────────────────────────────────────────┘
```

**Estados de Carregamento:**
- `loadingCandidates`: dropdown de candidatos carregando
- `loading`: dados de sentimento regional carregando
- `error`: exibe mensagem de erro
- Empty state: quando não há dados disponíveis

---

#### 1.5 Implementation Status (Phase 2 MVP - Completed 2026-05-09)

**✅ Backend (DONE)**
- [x] Create regional_sentiment_aggregated table
- [x] Seed mock data for all 27 states per candidate (realistic distribution)
- [x] Create /api/geo/regional-sentiment endpoint (with candidateId filter)
- [x] Calculate statistics: best_state, worst_state, average_sentiment
- [x] Error handling and proper HTTP status codes
- [x] API tested and verified returning 27 states with correct structure

**✅ Frontend (DONE)**
- [x] Install react-leaflet v4 and leaflet
- [x] Create BrazilMap component with Leaflet + OpenStreetMap
  - [x] Load GeoJSON from IBGE public dataset (27 Brazilian states)
  - [x] Color states by sentiment: -1 (red) → +1 (green)
  - [x] Interactive click to select state
  - [x] Hover highlighting with blue border
  - [x] Popup with state details (sentiment, volume, themes)
  - [x] Sentiment legend with 5 color levels
  - [x] Selected state details panel
- [x] Create StateRankingTable component
  - [x] Sort states by sentiment (descending)
  - [x] Color-coded sentiment badges with icons
  - [x] Click row to select/sync with map
  - [x] Display top 3 themes per state
  - [x] Locale-aware number formatting
- [x] Create GeoAnalysis page
  - [x] Candidate selector dropdown
  - [x] Two-column layout (map + statistics)
  - [x] Statistics panel (best/worst states, selected details)
  - [x] Full-width ranking table
  - [x] Error handling and loading states
  - [x] Empty state handling
- [x] React Router integration
  - [x] Add route /geo for GeoAnalysis page
  - [x] Navigation bar with tab links
  - [x] Dashboard at /

**✅ Styling (DONE)**
- [x] Install PostCSS and Autoprefixer
- [x] Create tailwind.config.js and postcss.config.js
- [x] Tailwind CSS properly configured and processing
- [x] All Tailwind utility classes rendering correctly

**📋 Next Phase (Data Integration - Phase 3)**
- [ ] Connect to real sentiment data pipeline
  - [ ] Modify news aggregation to extract location
  - [ ] Integrate Claude API for sentiment analysis
  - [ ] Implement geolocation enrichment
  - [ ] Aggregate results into regional_sentiment_aggregated
- [ ] Real-time updates
  - [ ] Implement WebSocket or Supabase Realtime for live updates
  - [ ] Auto-refresh map when new data arrives
- [ ] Performance optimization
  - [ ] Cache GeoJSON locally
  - [ ] Optimize database queries for large datasets
  - [ ] Implement pagination for table if needed
- [ ] Additional features
  - [ ] Timeline slider to view sentiment over time
  - [ ] Regional comparisons (heatmap overlay)
  - [ ] Export functionality (PNG map, CSV data)

---

## 💬 Feature 2: Chat AI Copilot

### Objetivo
Permitir que usuários façam perguntas em linguagem natural sobre seus dados e recebam respostas inteligentes de IA.

### User Stories
- "Quero perguntar 'Onde meu concorrente está crescendo?' sem clicar em gráficos"
- "Quero fazer perguntas complexas: 'Compare sentiment de meus 3 concorrentes no Nordeste'"
- "Quero que a IA sugira ações baseado nas respostas"

### Arquitetura Técnica

#### 2.1 Database Schema

```sql
-- Chat Conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  candidate_id UUID REFERENCES candidates,
  title VARCHAR(200), -- auto-generated from first question
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations,
  role VARCHAR(20), -- 'user' or 'assistant'
  content TEXT, -- the message text
  tokens_used INTEGER, -- for cost tracking
  created_at TIMESTAMP
);

CREATE INDEX idx_chat_messages_conversation_id 
  ON chat_messages(conversation_id, created_at DESC);
```

#### 2.2 Data Flow

```
Step 1: User sends message
├─ Message: "Onde meu concorrente está crescendo?"
├─ Frontend sends to /api/chat
└─ Include conversation_id + candidate_id

Step 2: Gather context data
├─ Query regional_sentiment_scores (last 7 days)
├─ Query competitor sentiment scores
├─ Query top trending themes
├─ Query growth rates per region
└─ Aggregate into context JSON

Step 3: Call Claude API
├─ System prompt: "You are a political reputation analyst..."
├─ User message: "Onde meu concorrente está crescendo?"
├─ Context: {
│     candidate_sentiment: {...},
│     competitor_sentiment: {...},
│     regional_breakdown: {...},
│     trending_themes: [...]
│   }
└─ Call Claude with streaming

Step 4: Stream response to frontend
├─ Claude generates response in Portuguese
├─ Stream response line-by-line
├─ Save full response to chat_messages
└─ Update conversation timestamp

Step 5: Save to database
├─ Save user message
├─ Save assistant response
├─ Calculate tokens used
└─ Track for billing
```

#### 2.3 API Endpoint

```typescript
// POST /api/chat
// Purpose: Chat with AI copilot

export async function POST(req: Request) {
  const {
    candidate_id,
    conversation_id,
    question
  } = await req.json();
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  // Get conversation history
  const history = await getConversationHistory(conversation_id);
  
  // Gather context data
  const context = await gatherContextData(candidate_id, 7); // last 7 days
  
  // Build messages for Claude
  const messages = [
    ...history.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: "user",
      content: buildContextualPrompt(question, context)
    }
  ];
  
  // Call Claude API with streaming
  const stream = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `You are a political reputation analyst with expertise in sentiment analysis,
             regional trends, and campaign strategy. You have access to real-time data
             about candidate sentiment, competitor tracking, and regional breakdowns.
             
             When answering questions:
             - Be specific and cite numbers from the data
             - Always suggest actionable recommendations
             - Distinguish between different regions when relevant
             - Highlight opportunities and threats
             - Respond in Portuguese.`,
    messages: messages,
    stream: true
  });
  
  // Stream response
  let fullResponse = "";
  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullResponse += text;
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      
      // Save to database after streaming completes
      await saveMessage(conversation_id, 'user', question);
      await saveMessage(conversation_id, 'assistant', fullResponse);
      
      controller.close();
    }
  });
}

// Helper: Build contextual prompt
function buildContextualPrompt(question, context) {
  return `
Context Data:
- My candidate sentiment (last 7 days):
  ${JSON.stringify(context.myCandidateSentiment, null, 2)}
  
- Competitor sentiment:
  ${JSON.stringify(context.competitorSentiment, null, 2)}
  
- Regional breakdown:
  ${JSON.stringify(context.regionalBreakdown, null, 2)}
  
- Trending themes:
  ${context.trendingThemes.map(t => t.theme + ' (' + t.volume + ')').join(', ')}

Question: ${question}

Answer based on this data. Be specific, cite numbers, and suggest actions.`;
}
```

#### 2.4 Frontend Components

**Component 1: Chat Container**
```tsx
export function ChatCopilot({ candidateId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendMessage = async () => {
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);
    
    // Stream response from API
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        candidate_id: candidateId,
        question: userMessage
      })
    });
    
    // Read stream and update UI incrementally
    let assistantMessage = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      assistantMessage += chunk;
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = assistantMessage;
        return newMessages;
      });
    }
    
    setIsLoading(false);
  };
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Faça uma pergunta... (ex: 'Onde meu concorrente está crescendo?')"
          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>
          {isLoading ? 'Pensando...' : 'Enviar'}
        </button>
      </div>
      
      <div className="suggestions">
        <p>Sugestões de perguntas:</p>
        <button onClick={() => setInput('Em qual região tenho melhor sentimento?')}>
          Regiões fortes
        </button>
        <button onClick={() => setInput('Quais são os 3 temas trending no Nordeste?')}>
          Temas por região
        </button>
      </div>
    </div>
  );
}
```

**Component 2: Chat Integration in Dashboard**
```tsx
export function Dashboard({ candidateId }) {
  return (
    <div className="dashboard-grid">
      <div className="main-content">
        <BrazilSentimentMap />
        <Alerts />
      </div>
      
      <aside className="sidebar">
        <ChatCopilot candidateId={candidateId} />
      </aside>
    </div>
  );
}
```

#### 2.5 Implementation Checklist

- [ ] **Week 1: Backend Setup**
  - [ ] Create chat_conversations and chat_messages tables
  - [ ] Create /api/chat endpoint
  - [ ] Test Claude API integration
  - [ ] Test streaming responses

- [ ] **Week 1-2: Context Gathering**
  - [ ] Helper function: gatherContextData()
  - [ ] Query sentiment scores for candidate + competitors
  - [ ] Query regional breakdown
  - [ ] Query trending themes
  - [ ] Format context for Claude

- [ ] **Week 2: Frontend**
  - [ ] Create ChatCopilot component
  - [ ] Implement message input/send
  - [ ] Implement streaming message display
  - [ ] Add suggested queries
  - [ ] Integrate into Dashboard sidebar

- [ ] **Week 2-3: Polish & Testing**
  - [ ] Test with various query types
  - [ ] Optimize context size (don't send too much)
  - [ ] Add error handling
  - [ ] Rate limit API calls (max 10/min per user)
  - [ ] Test Portuguese language support

---

## 📊 Combined Implementation Timeline

```
Week 1:
├─ Geographic Analysis: Database setup + backend API
├─ Chat Copilot: Database setup + /api/chat endpoint
└─ Both: Integration with existing sentiment pipeline

Week 2:
├─ Geographic Analysis: Frontend components + dashboard integration
├─ Chat Copilot: Frontend components + context gathering
└─ Both: Real-time subscriptions, E2E testing

Week 3:
├─ Performance optimization
├─ Security audit (rate limiting, injection prevention)
├─ Documentation
└─ Launch MVP with both features
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test: Regional sentiment aggregation
test('aggregates sentiment by region correctly', () => {
  const scores = [
    { state_code: 'SP', sentiment_score: 0.8 },
    { state_code: 'SP', sentiment_score: 0.6 },
    { state_code: 'RJ', sentiment_score: -0.1 }
  ];
  
  const result = aggregateByRegion(scores);
  expect(result[0].sentiment_score).toBe(0.7); // (0.8 + 0.6) / 2
});

// Test: Chat message saving
test('saves messages to database', async () => {
  await saveMessage(conversationId, 'user', 'Test question');
  const messages = await getConversationHistory(conversationId);
  expect(messages).toContainEqual({ role: 'user', content: 'Test question' });
});
```

### E2E Tests
```typescript
// Test: Full geographic analysis flow
test('user sees Brazil heat map with regional sentiments', async () => {
  // 1. Create candidate
  // 2. Add sentiment scores with locations
  // 3. Navigate to Regional Analysis page
  // 4. Verify heat map renders
  // 5. Verify regional ranking table shows data
});

// Test: Full chat flow
test('user asks question and gets AI response', async () => {
  // 1. Open chat copilot
  // 2. Type question
  // 3. Verify response streams in
  // 4. Verify messages saved to database
  // 5. Verify follow-up suggestions appear
});
```

---

## 💰 Cost Estimation

| Component | Unit Cost | Monthly Volume | Monthly Cost |
|-----------|-----------|-----------------|--------------|
| Claude API (Copilot) | $0.003 per 1K tokens | 1M tokens | $3 |
| Supabase PostGIS queries | Included | Unlimited | $0 |
| Recharts library | Open source | - | $0 |
| Storage (chat messages) | Included in Supabase | 100k messages | $0 |
| **TOTAL** | | | **~$3/mo** |

---

## 📌 Success Metrics

### Geographic Analysis
- ✅ Heat map renders correctly for all regions
- ✅ Regional sentiment updates in < 1 second
- ✅ Regional ranking accurately reflects top themes
- ✅ Users find regional insights actionable

### Chat Copilot
- ✅ Responses arrive in < 3 seconds
- ✅ Claude generates relevant answers > 90% of time
- ✅ Users ask follow-up questions (engagement metric)
- ✅ Suggested queries are clicked > 30% of time
