# EXECUTE NOW - Social Sense Setup

**Time:** ~1.5 hours total (5 min push + 1h setup)

---

## 📋 PASSO 1: Criar Repositório no GitHub (1 minuto)

1. Abra: https://github.com/new
2. **Nome:** `social-sense`
3. **Descrição:** Real-time opinion intelligence platform
4. **Visibility:** Public (ou Private)
5. **NÃO marque** "Initialize with README"
6. Clique **"Create repository"**
7. **COPIE a URL** que aparecer

A URL será algo como: `https://github.com/SEUUSERNAME/social-sense.git`

---

## 📤 PASSO 2: GitHub Push (5 minutos)

Substitua `SEUURL` pela URL do passo anterior e execute:

```bash
cd "/Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My Drive/Projects/social-sense"

git remote add origin SEUURL

git push -u origin main
```

**Exemplo completo:**
```bash
cd "/Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My Drive/Projects/social-sense"

git remote add origin https://github.com/vaniojr/social-sense.git

git push -u origin main
```

**Resultado esperado:**
```
Enumerating objects: 43, done.
...
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

**Verificar:** Visite seu repositório no GitHub (deve ver 43 arquivos)

---

## 🐳 PASSO 3: Iniciar Docker (2 minutos)

No **Terminal 1**, execute:

```bash
cd "/Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My Drive/Projects/social-sense"

docker-compose up -d
```

**Verificar:**
```bash
docker ps
```

Deve mostrar:
- `socialsense-db` (PostgreSQL)
- `socialsense-pgadmin` (pgAdmin)

---

## 🖥️ PASSO 4: Iniciar Backend (Terminal 2)

Abra um **novo terminal** e execute:

```bash
cd "/Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My Drive/Projects/social-sense/src/backend"

npm install

npm run dev
```

**Esperado:** 
```
✅ Server running on http://localhost:5000
```

**Deixe rodando neste terminal**

---

## ⚛️ PASSO 5: Iniciar Frontend (Terminal 3)

Abra um **outro novo terminal** e execute:

```bash
cd "/Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My Drive/Projects/social-sense/src/frontend"

npm install

npm run dev
```

**Esperado:**
```
➜ Local: http://localhost:3000/
```

**Deixe rodando neste terminal**

---

## ✅ PASSO 6: Verificar Tudo

Você deve ter **3 terminais rodando**:

| Terminal | O que esperar |
|----------|---------------|
| 1 (Docker) | `docker ps` mostra 2 containers |
| 2 (Backend) | ✅ Server running on http://localhost:5000 |
| 3 (Frontend) | ➜ Local: http://localhost:3000/ |

### Abra no navegador:

**http://localhost:3000**

Deve ver:
- Social Sense logo
- 3 status boxes
- ✅ Frontend: OK
- ✅ Backend: Connected
- ✅ Database: Accessible

Se todos os 3 são ✅ **SUCESSO!** 🎉

---

## 🔗 URLs Importantes

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend** | http://localhost:5000 |
| **Backend Health** | http://localhost:5000/api/health |
| **pgAdmin** | http://localhost:5050 |
| **GitHub Repo** | https://github.com/SEUUSERNAME/social-sense |

**pgAdmin Credentials:**
- Email: `admin@example.com`
- Senha: `admin`

---

## 🐛 Troubleshooting Rápido

### Docker falha
```bash
docker system prune
docker-compose up -d
```

### Porta já em uso (3000, 5000, 5432)
```bash
lsof -i :3000
kill -9 <PID>
```

### npm install falha
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Backend não conecta ao database
```bash
# Verifique se Docker está rodando
docker ps

# Veja logs
docker logs socialsense-db
```

---

## 📚 Depois (Próxima Etapa)

Uma vez que tudo estiver rodando:

1. Leia **PHASE_SUMMARY.md**
2. Leia **docs/DESIGN.md** (o que construir)
3. Leia **docs/IMPLEMENTATION_FEATURES.md** (como implementar)
4. Comece a implementar Geographic Analysis

---

## 🎯 Resumo Rápido

```
1. Criar repo no GitHub             (1 min)
2. git push origin main             (5 min)
3. docker-compose up -d             (2 min)
4. npm install + npm run dev        (15 min cada)
5. Verificar em http://localhost:3000

Total: ~1.5 horas
```

---

**Ready? Let's go! 🚀**
