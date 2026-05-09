# Setup Local - Central de Monitoramento Político com IA

## Pré-requisitos

### Obrigatório
- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** 9+ (vem com Node.js)
- **Git** ([download](https://git-scm.com/))
- **Docker** (para Supabase local) ([download](https://www.docker.com/))
- **Supabase CLI** (veja abaixo)

### Contas externas (criar durante setup)
- OpenAI API key (ChatGPT, GPT-4o)
- Anthropic API key (Claude)
- NewsAPI key (notícias)
- Twitter/X API keys (opcional para fase 1)
- n8n Cloud ou self-hosted (opcional para fase 1)

## 1. Clone e Setup Inicial

```bash
# Clone o repositório
git clone <seu-repo>
cd Analise_Politica

# Instale dependências
npm install

# Instale Supabase CLI (global)
npm install -g supabase

# Verifique as instalações
node --version  # v18.0.0+
npm --version   # 9.0.0+
supabase --version  # 1.0.0+
```

## 2. Configure Supabase Localmente

```bash
# Inicialize Supabase no projeto
supabase init

# Enable PostGIS extension (needed for geographic analysis)
supabase db remote set -P "postgresql.extensions" "[\"postgis\"]"

# Suba banco de dados local (Docker necessário)
supabase start

# Saída esperada:
# Started supabase local development setup.
# API URL: http://localhost:54321
# Anon key: eyJ...
# Service role key: eyJ...

# Verifique PostGIS
# psql -h localhost -U postgres -d postgres -p 5432
# SELECT postgis_version();
```

## 3. Configure Variáveis de Ambiente

```bash
# Crie arquivo .env.local
cp .env.example .env.local

# Edite .env.local com seus valores
```

Conteúdo de `.env.local`:

```env
# Supabase (do output de "supabase start")
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<seu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<seu-service-role-key>

# LLM APIs (criar contas em https://platform.openai.com e https://console.anthropic.com)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-... # Required for Chat AI Copilot ⭐

# External APIs (opcional para MVP)
NEWSAPI_KEY=<sua-key>
TWITTER_API_KEY=<opcional>

# Job Queue (criar conta em https://upstash.com)
QSTASH_TOKEN=<opcional-fase-2>

# Notifications (criar conta em https://sendgrid.com)
SENDGRID_API_KEY=<opcional-fase-2>

# Development
NODE_ENV=development
DEBUG=*
```

## 4. Criar Schema no Banco de Dados

```bash
# Copie o arquivo de migrations
cp docs/migrations/001_init_schema.sql ./supabase/migrations/

# Aplicar migrations
supabase db push

# Verificar se criou as tabelas
supabase db show
```

Se não tiver o arquivo de migrations, execute manualmente:

```bash
# Conecte ao banco local
PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -p 5432

# Dentro do psql, execute as queries do ARCHITECTURE.md (seção 4)
```

## 5. Configure o Supabase Auth (opcional para MVP)

```bash
# Na interface web do Supabase (http://localhost:54321)
# 1. Vá em Authentication → Providers
# 2. Ative Email (já vem ativo)
# 3. Configure SMTP (ou deixe o padrão local)
```

## 6. Start Frontend (Lovable)

```bash
# No terminal 1, mantenha Supabase rodando:
supabase start

# No terminal 2, rode o frontend:
npm run dev

# Saída esperada:
# ▲ Next.js 15.0.0
# - Local: http://localhost:3000
```

Acesse http://localhost:3000 no navegador.

## 7. Deploy Edge Functions Localmente

```bash
# Supabase já rodas as Edge Functions localmente
# Elas estão em src/backend/supabase/functions/

# Para listar funções:
supabase functions list

# Para fazer deploy de uma função (já feito automaticamente):
supabase functions deploy analyze
```

## 8. Setup n8n Localmente (Fase 2+)

### Opção A: n8n Cloud (recomendado para começar)
```bash
# 1. Crie conta em https://n8n.cloud
# 2. Crie nova workflow
# 3. Configure triggers e ações conforme docs/workflows/
```

### Opção B: n8n Self-Hosted (Docker)
```bash
# Rode n8n em Docker
docker-compose up -d n8n

# Acesse http://localhost:5678
# Configure seu webhook para Supabase:
# POST http://localhost:54321/functions/v1/analyze
```

## 9. Teste a Configuração

```bash
# 1. Crie um teste simples
# Abra http://localhost:3000
# Vá em Configurações → Adicionar Candidato
# Adicione um candidato de teste (ex: "João Silva")

# 2. Teste a API manualmente
curl -X POST http://localhost:54321/functions/v1/analyze \
  -H "Authorization: Bearer <seu-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "test-id",
    "texts": ["João Silva ganha prêmio de melhor vereador"],
    "type": "news"
  }'

# Esperado: 
# {
#   "analyses": [{
#     "sentiment": "positive",
#     "summary": "João Silva received an award",
#     ...
#   }]
# }

# 3. Teste real-time (abra dois navegadores)
# Terminal 1: npm run dev
# Terminal 2: npm run test:realtime
# Deve ver updates em tempo real
```

## 10. Estrutura de Pastas Esperada

```
Analise_Politica/
├── src/
│   ├── frontend/          # Código React (gerado por Lovable)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   ├── backend/           # Edge Functions
│   │   ├── supabase/functions/
│   │   │   ├── analyze/    # POST analyze
│   │   │   ├── sentiment/  # POST sentiment
│   │   │   ├── alert/      # POST alert
│   │   │   └── webhook/    # POST webhook (from n8n)
│   │   └── types/          # TypeScript types
│   └── workflows/         # n8n workflows (JSON exports)
│       ├── news-aggregation.json
│       ├── social-monitoring.json
│       └── alert-triggers.json
├── supabase/
│   ├── migrations/        # SQL migrations
│   ├── config.toml        # Configuração Supabase
│   └── seed.sql           # Dados de teste
├── docs/
│   ├── DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── SETUP.md (este arquivo)
│   ├── API.md
│   └── migrations/
│       └── 001_init_schema.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.local (não commitar)
├── package.json
├── tsconfig.json
├── next.config.js (ou lovable config)
└── README.md
```

## 11. Troubleshooting

### Erro: "Supabase não inicia"
```bash
# Verifica se Docker está rodando
docker ps

# Se não, inicie Docker e tente novamente
supabase start

# Se continuar, limpe e reinicie
supabase stop
docker system prune
supabase start
```

### Erro: "Port 54321 already in use"
```bash
# Outra instância está rodando. Mate-a:
lsof -ti:54321 | xargs kill -9

# Ou mude a porta em supabase/config.toml
[api]
port = 54322
```

### Erro: "ANTHROPIC_API_KEY not found"
```bash
# Crie conta em https://console.anthropic.com
# Copie sua API key
# Adicione em .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend não atualiza em tempo real
```bash
# Verifique se Supabase Realtime está ativo
supabase status

# Veja os logs do frontend
npm run dev -- --debug

# Verifique conexão no Console do navegador (F12)
```

### npm install falha
```bash
# Limpe cache e tente novamente
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Ou use npm versão mais recente
npm install -g npm@latest
npm install
```

## 12. Próximos Passos

1. **Entenda a arquitetura:** Leia [docs/ARCHITECTURE.md](ARCHITECTURE.md)
2. **Comece o desenvolvimento:** Vá para `src/frontend/` e comece a editar
3. **Crie seu primeiro workflow:** Vá para `src/workflows/` e importe em n8n
4. **Teste com dados reais:** Integre com NewsAPI (fase 2+)

## 13. Comandos Úteis (Quick Reference)

```bash
# Desenvolvimento
npm run dev                  # Start frontend
supabase start              # Start backend
supabase db reset           # Reset DB (cuidado!)

# Testes
npm test                    # Unit tests
npm run test:e2e            # E2E tests

# Deploy local → Cloud
supabase link --project-ref <seu-projeto>
supabase push               # Deploy migrations
supabase functions deploy   # Deploy Edge Functions

# Limpeza
supabase stop               # Stop local services
npm run clean               # Limpar cache/build
```

## 14. Recursos Adicionais

- [Supabase Docs](https://supabase.com/docs)
- [Next.js / Lovable Docs](https://nextjs.org/docs)
- [Supabase CLI Reference](https://supabase.com/docs/guides/cli)
- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com/)
