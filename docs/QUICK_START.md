# Fase 1: Quick Start - Setup Local

**Status:** Ready to execute  
**Time Estimate:** 30-60 minutes  
**Prerequisites:** Docker, Node.js 18+, npm

---

## 🚀 5 Steps to Get Everything Running

### Step 1: Start Docker + PostgreSQL (2 minutes)

```bash
# Go to project root
cd "/Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My Drive/Projects/social-sense"

# Start Docker containers (PostgreSQL + pgAdmin)
docker-compose up -d

# Verify they're running
docker ps
# Should show: socialsense-db and socialsense-pgadmin
```

**Verify Database:**
- Open browser: http://localhost:5050
- Email: `admin@example.com`
- Password: `admin`
- Should see database `socialsense` with all tables created

---

### Step 2: Setup Backend (Node.js) (15 minutes)

```bash
# Open new terminal tab
cd src/backend

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env

# Edit .env if needed (defaults should work)
# nano .env

# Start backend server
npm run dev
```

**Expected Output:**
```
✅ Server running on http://localhost:5000
📚 API documentation: http://localhost:5000
🔗 Frontend: http://localhost:3000
🗄️  Database: localhost:5432/socialsense
```

**Verify Backend:**
```bash
# In another terminal
curl http://localhost:5000/api/health

# Should return:
# {"status":"ok","timestamp":"...","database":"connected"}
```

---

### Step 3: Setup Frontend (React) (15 minutes)

```bash
# Open new terminal tab
cd src/frontend

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE v5.0.0  ready in 234 ms

➜  Local:   http://localhost:3000/
➜  Press h to show help
```

**Verify Frontend:**
- Open browser: http://localhost:3000
- Should see Social Sense dashboard
- Green message: "✅ Backend is running"
- All 3 status boxes green

---

### Step 4: Verify All Components ✅

You should have 3 terminals running:

**Terminal 1: Database**
```bash
docker ps
# postgres and pgadmin running
```

**Terminal 2: Backend**
```bash
cd src/backend
npm run dev
# Running on :5000
```

**Terminal 3: Frontend**
```bash
cd src/frontend
npm run dev
# Running on :3000
```

**Checklist:**
- [ ] Docker containers running: `docker ps`
- [ ] Backend API responding: `curl http://localhost:5000/api/health`
- [ ] Frontend loading: http://localhost:3000
- [ ] pgAdmin accessible: http://localhost:5050
- [ ] Database has tables: Check in pgAdmin

---

### Step 5: Make a Test API Call

From Frontend browser console (F12 → Console):

```javascript
// Test fetching candidates
fetch('http://localhost:5000/api/candidates')
  .then(r => r.json())
  .then(d => console.log('Candidates:', d))
```

Expected output:
```javascript
Candidates: [
  {id: "...", name: "Lula", category: "politician", ...},
  {id: "...", name: "Bolsonaro", category: "politician", ...},
  ...
]
```

---

## 📊 Architecture Overview (What's Running)

```
┌─────────────────────────────────────────┐
│     Frontend (React + Vite)             │
│     http://localhost:3000               │
├─────────────────────────────────────────┤
│     Backend (Node.js + Express)         │
│     http://localhost:5000               │
├─────────────────────────────────────────┤
│     Database (PostgreSQL)               │
│     localhost:5432                      │
│     ├─ candidates (sample data)         │
│     ├─ sentiment_scores (empty)         │
│     ├─ news_articles (empty)            │
│     ├─ alerts (empty)                   │
│     └─ chat_conversations (empty)       │
├─────────────────────────────────────────┤
│     pgAdmin (Database UI)               │
│     http://localhost:5050               │
└─────────────────────────────────────────┘
```

---

## 🔧 Useful Commands

### Database
```bash
# Connect directly to database
psql -h localhost -U postgres -d socialsense

# In psql:
\dt                    # List tables
SELECT * FROM candidates;  # View candidates
\q                     # Quit

# View logs
docker logs socialsense-db
docker logs socialsense-pgadmin
```

### Backend
```bash
# From src/backend/
npm run dev            # Start dev server
npm run build          # Build for production
npm run lint           # Check code style
npm run type-check     # Check TypeScript
```

### Frontend
```bash
# From src/frontend/
npm run dev            # Start dev server
npm run build          # Build for production
npm run lint           # Check code style
npm run type-check     # Check TypeScript
```

### Docker
```bash
# See running containers
docker ps

# View logs
docker-compose logs postgres
docker-compose logs pgadmin

# Stop everything
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill the process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port in vite.config.ts
```

### "Port 5000 already in use"
```bash
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
```

### "Cannot connect to database"
```bash
# Verify docker containers are running
docker ps

# Check PostgreSQL logs
docker logs socialsense-db

# Verify credentials in .env match docker-compose.yml
```

### "Frontend can't reach backend"
```bash
# Check CORS in src/backend/src/main.ts
# Check VITE_API_URL in src/frontend/.env

# Test backend directly:
curl -i http://localhost:5000/api/health
```

### "npm install fails"
```bash
# Clear cache and try again
rm -rf node_modules package-lock.json
npm install

# Or use legacy peer deps
npm install --legacy-peer-deps
```

---

## 📚 Next Steps

Once everything is running:

1. **Explore the codebase:**
   - `src/backend/src/main.ts` - API endpoints
   - `src/frontend/src/App.tsx` - React component

2. **Start implementing features:**
   - Geographic Analysis (DESIGN.md → Feature #1)
   - Chat AI Copilot (DESIGN.md → Feature #2)

3. **Commit to GitHub:**
   ```bash
   git add src/
   git commit -m "Add frontend and backend setup"
   git push origin main
   ```

4. **Read documentation:**
   - [docs/IMPLEMENTATION_FEATURES.md](docs/IMPLEMENTATION_FEATURES.md) - How to build features
   - [docs/API.md](docs/API.md) - External APIs
   - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design

---

## ✅ Verification Checklist

```
Database:
✅ docker ps shows socialsense-db
✅ docker ps shows socialsense-pgadmin
✅ pgAdmin loads at http://localhost:5050
✅ Database "socialsense" exists
✅ All tables created (candidates, sentiment_scores, news_articles, etc)
✅ Sample data in candidates table

Backend:
✅ npm install completed
✅ .env file exists
✅ npm run dev starts server
✅ http://localhost:5000 shows API info
✅ http://localhost:5000/api/health returns OK
✅ http://localhost:5000/api/candidates returns data

Frontend:
✅ npm install completed
✅ .env file exists
✅ npm run dev starts dev server
✅ http://localhost:3000 loads page
✅ Backend status shows green ✅
✅ Database status accessible
✅ Network requests work

Overall:
✅ All 3 terminals running
✅ No error messages
✅ Can make API calls
✅ Ready for Phase 2 - Development
```

---

## 🎉 Success!

If you see:
- ✅ Frontend loads with green status badges
- ✅ Backend API responds with data
- ✅ Database accessible via pgAdmin
- ✅ No errors in any console

**You're ready to start Phase 2: MVP Development!**

Next: Follow [docs/IMPLEMENTATION_FEATURES.md](docs/IMPLEMENTATION_FEATURES.md) to build features.

---

**Questions?** Check [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md) for detailed instructions.
