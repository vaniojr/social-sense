# Deployment Guide - Social Sense

**Status:** Ready for MVP deployment  
**Last Updated:** 2026-05-09  
**Stack:** React (Vercel) + Node/Python (Railway) + PostgreSQL (Railway)

---

## 📋 Checklist Pré-Deploy

```
[ ] MVP features implementadas e testadas localmente
[ ] Repositório GitHub criado (público ou privado)
[ ] Variáveis .env configuradas corretamente
[ ] Tests passando: npm test
[ ] Build funcionando: npm run build
[ ] Nenhum arquivo .env commitado (.gitignore ok)
[ ] Documentação atualizada
```

---

## 🚀 Deployment - 6 Fases

### Fase 1: GitHub Repository Setup

```bash
# Se ainda não tem repositório:
cd ~/Projects/social-sense

git init
git add .
git commit -m "Initial commit: Social Sense MVP"
git branch -M main

# Crie repositório no GitHub (https://github.com/new)
# Depois execute:
git remote add origin https://github.com/YOUR_USERNAME/social-sense.git
cd social-sense

# Se ainda não fez:
git init
git add .
git commit -m "Initial commit: Social Sense MVP"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

---

### Passo 2: Deploy Frontend em Vercel

#### 2.1 Criar Conta Vercel

```
1. Vá em: https://vercel.com
2. Clique "Sign Up"
3. Escolha "GitHub" para login
4. Autorize Vercel no GitHub
5. Pronto!
```

#### 2.2 Deploy Frontend

```
1. Dashboard Vercel → "New Project"
2. Selecione seu repositório socialsense
3. Vercel auto-detecta React
4. Clique "Deploy"
5. Aguarde build (~3 minutos)
6. Seu frontend está em: https://socialsense.vercel.app
```

#### 2.3 Apontar Domínio em Cloudflare

```
1. Dashboard Vercel → Settings → Domains
2. Clique "Add Domain"
3. Preencha: socialsense.io
4. Vercel dá instruções DNS
5. Vá em Cloudflare → DNS
6. Adicione registros:
   - CNAME: @ -> cname.vercel-dns.com
   (Vercel fornece exato)
7. Propagação: ~1 hora
8. Seu frontend em: https://socialsense.io
```

---

### Passo 3: Deploy Backend em Railway

#### 3.1 Criar Conta Railway

```
1. Vá em: https://railway.app
2. Clique "Login with GitHub"
3. Autorize Railway
4. Pronto!
```

#### 3.2 Deploy Backend + PostgreSQL

```
1. Dashboard Railway → "New Project"
2. Clique "+ Add from GitHub repo"
3. Selecione seu repo socialsense
4. Railway detecta Node.js/Python
5. Clique "Deploy"
6. Aguarde (~5 minutos)
```

#### 3.3 Configure Variáveis de Ambiente

```
1. Project Railway → Variables (environment vars)
2. Adicione todas de .env:
   - DB_HOST: (Railway fornece)
   - DB_PASSWORD: (Railway fornece)
   - CLAUDE_API_KEY: (sua chave)
   - NEWSAPI_KEY: (sua chave)
   - NODE_ENV: production
3. Clique "Redeploy"
```

#### 3.4 PostgreSQL em Railway

```
Railway auto-cria PostgreSQL quando você deploy.

Para adicionar manualmente:
1. Project → Plugins → Add
2. PostgreSQL → Add
3. Railway fornece credenciais
4. Use em variáveis de ambiente
5. Conecte via pgAdmin remoto se quiser
```

---

## 🔄 Setup Automático (GitHub Actions)

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        working-directory: ./src/frontend

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: railway up --token ${{ secrets.RAILWAY_TOKEN }}
        working-directory: ./src/backend
```

**Setup:**
```
1. Gere tokens:
   - Vercel: Settings → Tokens → Create
   - Railway: Settings → Tokens → Create

2. Adicione em GitHub:
   - Repo → Settings → Secrets
   - VERCEL_TOKEN
   - RAILWAY_TOKEN

3. Quando fizer git push main:
   - GitHub Actions roda
   - Frontend deploya em Vercel
   - Backend deploya em Railway
   - Tudo automático em ~10 minutos
```

---

## 📊 Monitoramento

### Sentry (Error Tracking)

```
1. Vá em: https://sentry.io
2. Create account (free)
3. New project → Node.js
4. Instale SDK:
   npm install @sentry/node

5. Configure no backend:
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });

6. Erros aparecem em dashboard Sentry
7. Receba alertas por email
```

### Logs

```
Vercel Logs:
- Dashboard Vercel → Logs
- Veja erros frontend em tempo real

Railway Logs:
- Project Railway → Logs
- Veja erros backend em tempo real

GitHub Actions:
- Repo → Actions
- Veja build status, erros no deploy
```

---

## 💰 Custos Production

```
Cloudflare Registrar:    R$ 5/mês
Vercel (Frontend):       R$ 0/mês (hobby free)
Railway (Backend):       R$ 100/mês (conforme uso)
Claude API:             R$ 80/mês (pay-as-you-go)
Sentry (Monitoring):    R$ 0/mês (free tier)
─────────────────────
TOTAL:                  R$ 185/mês
```

---

## 🔒 Segurança em Production

### Proteja Variáveis Secretas

```
NUNCA faça commit de:
- .env (adicione em .gitignore)
- API keys
- Senhas de banco
- JWT secrets

Use:
- GitHub Secrets (para CI/CD)
- Railway Variables (para production)
- Vercel Environment (para frontend)
```

### Configure CORS

```javascript
// Backend: src/backend/src/main.ts
app.use(cors({
  origin: 'https://socialsense.io',  // seu domínio
  credentials: true
}));
```

### Atualize URLs

```javascript
// Frontend: src/frontend/.env.production
REACT_APP_API_URL=https://api.socialsense.io
# (apontando para seu backend em Railway)
```

---

## 📈 Escalabilidade Futura

Se MVP crescer:

```
Vercel:
├─ Upgrade de hobby → pro (quando precisar)
├─ Caching melhor
└─ Analytics de performance

Railway:
├─ Upgrade para tier maior
├─ Auto-scaling
├─ Redis cache (se precisar)

PostgreSQL:
├─ Backup automático (Railway faz)
├─ Replicação (tier pago)
└─ Backups geográficos

Claude API:
├─ Batch processing (economizar)
├─ Prompt caching (economizar)
└─ Dedicado se volume alto
```

---

## 🚨 Troubleshooting Deployment

### Frontend não deploar

```
Problema: Build falha em Vercel

Solução:
1. Verifique logs Vercel → Deployments
2. Fix error localmente (npm run build)
3. Faça git push novamente
4. Vercel redeploya automaticamente
```

### Backend não conecta ao BD

```
Problema: Railway backend não conecta PostgreSQL

Solução:
1. Verifique variáveis (RAILWAY_DATABASE_URL)
2. Railway → Variables → mostram credenciais
3. Copie e cole exatamente
4. Teste conexão localmente primeiro
5. Redeploy em Railway
```

### Domínio não aponta

```
Problema: socialsense.io ainda não funciona

Solução:
1. Aguarde DNS propagação (até 24h)
2. Verifique registros em Cloudflare:
   - CNAME para Vercel
   - Nenhum A record conflitante
3. Teste: ping socialsense.io (deve resolver)
4. Limpe cache browser (Ctrl+Shift+Delete)
```

---

## ✅ Checklist Final

```
[ ] Frontend deploado em Vercel
[ ] Backend deploado em Railway
[ ] PostgreSQL em Railway funcionando
[ ] Domínio apontando para Vercel
[ ] Backend CORS permitindo seu domínio
[ ] Variáveis de ambiente em Railway
[ ] GitHub Actions CI/CD funcionando
[ ] Sentry monitorando erros
[ ] SSL/HTTPS funcionando
[ ] Tests passando em produção
[ ] Documentação atualizada
```

---

## 🎉 Deploy Completo!

Seu social sense está no ar:
- **Frontend:** https://socialsense.io
- **Backend API:** https://socialsense.io/api (atrás de proxy)
- **Email:** hello@socialsense.io

**Próximos passos:**
1. Teste todas features em produção
2. Monitore erros em Sentry
3. Otimize performance
4. Escale conforme crescer

---

## 📞 Referência Rápida

```bash
# Push com auto-deploy
git push origin main
# GitHub Actions → Vercel + Railway

# Ver logs
# Vercel: https://vercel.com/dashboard
# Railway: https://railway.app/project
# Sentry: https://sentry.io/dashboard

# Redeploy manual
# Vercel: Click "Redeploy"
# Railway: Click "Deploy"
```

**Sucesso!** 🚀
