# Setup Local - Social Sense

## ✅ Pré-requisitos

```bash
# Verificar se tem instalado:
node --version          # v18.0.0+
npm --version           # 9.0.0+
git --version           # qualquer versão recente
docker --version        # Desktop ou Community Edition
docker-compose --version
```

Se não tiver, instale:
- **Node.js:** https://nodejs.org/ (recomendado: LTS 18+)
- **Docker Desktop:** https://www.docker.com/products/docker-desktop/
- **Git:** https://git-scm.com/

---

## 🚀 Setup em 5 Passos

### Passo 1: Clone o Repositório

```bash
# Crie uma pasta para o projeto
mkdir ~/projects
cd ~/projects

# Clone (substitua <repo-url> pelo URL do GitHub)
git clone <repo-url> socialsense
cd socialsense

# Verifique que está no diretório certo
pwd  # deve acabar com /socialsense
ls   # deve ver: CLAUDE.md, README.md, docs/, src/, etc
```

---

### Passo 2: Setup PostgreSQL (Docker)

```bash
# Inicie o Docker Desktop (se for Mac/Windows)
# ou verifique que está rodando: docker ps

# Crie docker-compose.yml na raiz do projeto:
# (arquivo já deve existir no repositório)

# Suba os containers
docker-compose up -d

# Verifique que está rodando
docker ps
# Deve ver: postgres, pgAdmin containers

# Acesse pgAdmin (gerenciar banco visualmente)
# http://localhost:5050
# Email: admin@example.com
# Senha: admin
```

**Criar banco de dados:**
```sql
-- Conecte em pgAdmin
-- Crie database: socialsense
-- Usuário: postgres
-- Senha: postgres (verificar docker-compose.yml)
```

---

### Passo 3: Setup Frontend (React)

```bash
# Na raiz do projeto, crie pasta frontend
mkdir -p src/frontend
cd src/frontend

# Crie React app
npx create-react-app . --template typescript

# Instale dependências extras
npm install recharts axios zustand

# Inicie dev server
npm run dev

# Abra no navegador
# http://localhost:3000
```

**Estrutura frontend esperada:**
```
src/frontend/
├── public/
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── styles/
├── package.json
├── tsconfig.json
└── .env.example
```

---

### Passo 4: Setup Backend (Node.js)

```bash
# Na raiz do projeto
mkdir -p src/backend
cd src/backend

# Inicie projeto Node
npm init -y

# Instale dependências
npm install express cors dotenv @anthropic-ai/sdk pg axios

# Instale dev dependencies
npm install --save-dev typescript ts-node @types/express @types/node

# Crie arquivo main.ts
cat > src/main.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Rotas básicas
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/sentiment', (req, res) => {
  // TODO: Implementar
  res.json({ sentiment: 0, message: 'Not implemented yet' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
EOF

# Atualize package.json scripts
# Adicione em "scripts":
# "dev": "ts-node src/main.ts",
# "build": "tsc",
# "start": "node dist/main.js"

# Inicie servidor
npm run dev
```

**Servidor deve rodar em:** `http://localhost:5000`

---

### Passo 5: Verificar Tudo

```bash
# Terminal 1: Frontend (src/frontend/)
cd src/frontend
npm run dev
# http://localhost:3000

# Terminal 2: Backend (src/backend/)
cd src/backend
npm run dev
# http://localhost:5000

# Terminal 3: Database (raiz)
docker-compose ps
# Verifica que postgres + pgAdmin estão rodando

# Teste Backend
curl http://localhost:5000/api/health
# Deve retornar: { "status": "ok", "timestamp": "..." }

# Teste Frontend
# Abra http://localhost:3000 no navegador
# Deve ver React app rodando
```

---

## 🔧 Variáveis de Ambiente

### Frontend (.env)

```bash
# src/frontend/.env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLAUDE_API_KEY=  # deixar vazio, backend cuida
```

### Backend (.env)

```bash
# src/backend/.env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=socialsense

# APIs
CLAUDE_API_KEY=sk-ant-...
NEWSAPI_KEY=...

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 🗄️ Setup do Banco de Dados

### Conectar PostgreSQL via código

```typescript
// src/backend/src/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;
```

### Criar tabelas

```sql
-- Executar em pgAdmin ou psql

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sentiment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  sentiment_score DECIMAL(-1, 1),
  volume INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  title VARCHAR(255),
  severity VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  messages JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sentiment_candidate ON sentiment_scores(candidate_id);
CREATE INDEX idx_alerts_candidate ON alerts(candidate_id);
CREATE INDEX idx_chat_candidate ON chat_conversations(candidate_id);
```

---

## 🚨 Troubleshooting

### Docker não inicia
```bash
# Reinicie Docker Desktop
# ou no terminal:
docker system prune
docker-compose up -d
```

### Porta já em uso (3000, 5000, 5432)
```bash
# Encontre processo usando porta
lsof -i :3000   # Frontend
lsof -i :5000   # Backend
lsof -i :5432   # PostgreSQL

# Mate processo (substitua PID)
kill -9 <PID>
```

### npm install falha
```bash
# Limpe cache
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### PostgreSQL connection error
```bash
# Verifique docker-compose.yml está correto
# Verifique variáveis .env
# Teste conexão
docker-compose exec postgres psql -U postgres -d socialsense
```

---

## ✅ Verificação Final

```bash
# Frontend: http://localhost:3000
# ✅ React app carrega
# ✅ Console sem erros

# Backend: http://localhost:5000/api/health
# ✅ Retorna { "status": "ok", ... }

# Database: pgAdmin http://localhost:5050
# ✅ Banco socialsense existe
# ✅ Tabelas criadas

# Git: Seu fork clonado
# ✅ git status mostra repo clean
# ✅ git log mostra commits
```

---

## 🎯 Próximo Passo

Agora que tudo está rodando localmente:

1. **Criar primeira feature:** News Aggregation
2. **Adicionar Claude API:** Para análise de sentimento
3. **Criar endpoints:** GET /news, POST /analyze
4. **Conectar Frontend:** Mostrar notícias no React

**Consulte:** [docs/IMPLEMENTATION_FEATURES.md](IMPLEMENTATION_FEATURES.md)

---

## 📚 Comandos Rápidos

```bash
# Iniciar tudo
docker-compose up -d
cd src/frontend && npm run dev &
cd src/backend && npm run dev &

# Parar tudo
docker-compose down
# Ctrl+C nos terminais

# Ver logs
docker-compose logs postgres
npm logs frontend
npm logs backend

# Limpar tudo (cuidado!)
docker-compose down -v
rm -rf node_modules src/*/node_modules
```

**Pronto? Vamos codar!** 🚀
