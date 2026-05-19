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

**Índice centralizado:** [docs/INDEX.md](docs/INDEX.md)

**Principais documentos:**
- [CLAUDE.md](CLAUDE.md) - Guia para Claude Code
- [docs/QUICK_START.md](docs/QUICK_START.md) - Começar em 5 minutos
- [docs/DESIGN.md](docs/DESIGN.md) - Requisitos do produto
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura técnica
- [docs/IMPLEMENTATION_FEATURES.md](docs/IMPLEMENTATION_FEATURES.md) - Como implementar
- [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md) - Setup local
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Deploy em produção

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
social-sense/
├── CLAUDE.md                      # Guia para Claude Code (obrigatório ler)
├── README.md                      # Este arquivo
├── .gitignore
│
├── docs/                          # 📚 Toda a documentação centralizada
│   ├── INDEX.md                   # Índice de documentação
│   ├── QUICK_START.md             # Começar em 5 minutos
│   ├── DESIGN.md                  # Requisitos do produto
│   ├── ARCHITECTURE.md            # Arquitetura técnica
│   ├── IMPLEMENTATION_FEATURES.md
│   ├── SETUP_LOCAL.md             # Setup local
│   ├── EMAIL_SETUP.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── API.md                     # Documentação de APIs
│   ├── PROJECT_STRUCTURE.md
│   ├── ROADMAP.md
│   ├── FINAL_STACK_CONFIRMATION.md
│   ├── qa/                        # 🧪 Relatórios de QA
│   │   ├── BLOCO_B_QA_REPORT.md
│   │   ├── QA_VALIDATION_REPORT.md
│   │   └── QA_CHAT_FINAL_REPORT.md
│   ├── reports/                   # 📊 Relatórios de implementação
│   │   ├── BLOCO_A_COMPLETE.md
│   │   └── CHAT_IMPLEMENTATION_STATUS.md
│   └── archived/                  # 📦 Histórico de documentação
│
├── config/                        # ⚙️ Configuração
│   ├── .env.example               # Variáveis de ambiente
│   └── docker-compose.yml         # PostgreSQL local
│
├── scripts/                       # 🤖 Automações
│   ├── init-db.sql
│   ├── push-and-run.sh
│   └── ...
│
├── src/                           # 💻 Código fonte
│   ├── frontend/                  # React + TypeScript
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── backend/                   # Node.js + Express
│   │   ├── src/
│   │   │   ├── utils/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── scripts/                   # GitHub Actions, automações
│
└── .github/                       # 🚀 CI/CD
    └── workflows/
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

## 🗄️ Banco de Dados (Migrations + Backup)

```bash
# Aplicar migrations versionadas
cd src/backend
npm run migrate

# Voltar para raiz e habilitar hook (uma vez por clone)
cd ../..
bash scripts/setup-git-hooks.sh

# Sync com backup automático antes do push
bash scripts/git-sync.sh "chore: sync"
```

## 📞 Próximos Passos

1. **Ler documentação:** [docs/INDEX.md](docs/INDEX.md) (índice completo)
2. **Começar rápido:** [docs/QUICK_START.md](docs/QUICK_START.md)
3. **Setup local:** [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)
4. **Começar desenvolvimento:**
   - Frontend: [src/frontend/](src/frontend/)
   - Backend: [src/backend/](src/backend/)

---

**Fase atual:** Documentação atualizada (2026-05-09)  
**Próxima:** Setup local + primeira feature

**Precisa de ajuda?** Consulte [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)
