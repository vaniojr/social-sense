# Social Sense - Inteligência da Opinião Pública

Uma plataforma SaaS de monitoramento e análise de opinião pública em tempo real, alimentada por IA.

## 🎯 O Que É

Sistema completo para **políticos, influencers, brands e celebridades** monitorarem e analisarem a opinião pública sobre eles:

- ✅ Monitoramento em tempo real (notícias + redes sociais)
- ✅ Análise de sentimento por tópico e região
- ✅ 🗺️ Mapa de Sentimento Regional - visualize dados por estado/região
- ✅ 💬 Chat IA Copilot - pergunte em linguagem natural
- ✅ Detecção de crises e campanhas coordenadas
- ✅ Análise de concorrentes/influencers
- ✅ Alertas automáticos (< 5 min)
- ✅ Dashboard em tempo real

## 💰 Modelo de Negócio

**Público-alvo:**
- Agências políticas (gerenciam múltiplos candidatos)
- Agências de influencers (dezenas de influenciadores)
- Equipes de marketing de brands
- Consultores de crise/reputação

**Modelo de cobrança:**
- **B2B SaaS:** Assinatura mensal (R$ 2k–20k/mês)
- **Por vertical:** Política, Influencers, Brands
- **White-label:** Revenda para agências
- **Por número de personas:** Escalável (1 a 1000+ monitorados)

## 🚀 Status

- [ ] MVP (fase 1) - Local development
  - [x] Documentação
  - [ ] Frontend (React)
  - [ ] Backend (Node/Python)
  - [ ] Geographic Analysis
  - [ ] Chat AI Copilot
- [ ] Deploy (fase 2) - Vercel + Railway
- [ ] Marketing & Sales (fase 3)

## 📖 Documentação

- [CLAUDE.md](CLAUDE.md) - Guia para Claude Code
- [FINAL_STACK_CONFIRMATION.md](FINAL_STACK_CONFIRMATION.md) - Stack confirmado
- [docs/DESIGN.md](docs/DESIGN.md) - Requisitos do produto
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura técnica
- [docs/IMPLEMENTATION_FEATURES.md](docs/IMPLEMENTATION_FEATURES.md) - Como implementar
- [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md) - Setup local (próxima)
- [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) - Zoho Mail + Gmail (próxima)
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Deploy em produção (próxima)

## 🛠️ Stack Técnico

### Development (Agora)
- **Frontend:** React + TypeScript (VSCode)
- **Backend:** Node.js/Express ou Python/FastAPI
- **Database:** PostgreSQL (Docker local)
- **LLM:** Claude API (análise + chat)
- **Git:** GitHub + GitHub Actions

### Production (Depois)
- **Domínio:** socialsense.io (Cloudflare Registrar)
- **Email:** hello@socialsense.io (Zoho Mail)
- **Frontend:** Vercel (React)
- **Backend:** Railway (Node/Python + PostgreSQL)
- **APIs:** Claude API, NewsAPI

**Custo Produção:** R$ 185/mês

## 🎬 Começar

### Pré-requisitos
```bash
# Você precisa ter instalado:
- Node.js 18+
- Docker + Docker Compose
- Git
- VSCode
- Uma conta GitHub (grátis)
```

### Setup Local (5 minutos)
```bash
# 1. Clone o repositório
git clone <repo-url>
cd Analise_Politica

# 2. Setup frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# 3. Em outro terminal, setup backend
cd ../backend
npm install
npm run server  # http://localhost:5000

# 4. Em outro terminal, setup database
docker-compose up -d  # PostgreSQL + pgAdmin
```

**Mais detalhes:** Ver [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)

## 📁 Estrutura do Projeto

```
Analise_Politica/
├── CLAUDE.md                    # Guia para Claude Code
├── README.md                    # Este arquivo
├── FINAL_STACK_CONFIRMATION.md  # Stack confirmado
├── docker-compose.yml           # PostgreSQL local
│
├── docs/
│   ├── DESIGN.md               # Requisitos do produto
│   ├── ARCHITECTURE.md         # Arquitetura técnica
│   ├── IMPLEMENTATION_FEATURES.md
│   ├── SETUP_LOCAL.md          # Setup local (próx)
│   ├── EMAIL_SETUP.md          # Email config (próx)
│   ├── DEPLOYMENT_GUIDE.md     # Produção (próx)
│   └── archived/               # Histórico
│
├── src/
│   ├── frontend/               # React app
│   │   ├── public/
│   │   ├── src/
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── backend/                # Node/Python backend
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── package.json        # (Node)
│   │   └── requirements.txt    # (Python)
│   │
│   └── scripts/                # Automações
│       ├── scrape_news.py
│       ├── analyze_sentiment.py
│       └── ...
│
├── .github/
│   └── workflows/              # GitHub Actions
│       ├── ci.yml
│       └── deploy.yml
│
└── ideas.txt                   # Brainstorming original
```

## 🔄 Workflow de Desenvolvimento

```
1. Clone repo local
2. Setup frontend + backend (npm install)
3. Start Docker (postgres + pgAdmin)
4. Desenvolva em VSCode
5. Teste localmente
6. Git push → GitHub Actions
7. Deploy automático (Vercel + Railway)
```

## 📞 Próximos Passos

1. **Ler documentação:** [docs/DESIGN.md](docs/DESIGN.md)
2. **Setup local:** [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)
3. **Configurar email:** [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)
4. **Começar development:**
   - Frontend: [src/frontend/](src/frontend/)
   - Backend: [src/backend/](src/backend/)

---

**Fase atual:** Documentação atualizada (2026-05-09)  
**Próxima:** Setup local + primeira feature

**Precisa de ajuda?** Consulte [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)
