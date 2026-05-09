# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Social Sense** - A SaaS platform for real-time analysis of public opinion (sentiment, reputation, narratives).

**Multi-vertical platform** that serves:
- 🏛️ **Politics:** Campaigns, parties, political agencies, elected officials
- 🌟 **Influencers:** Content creators, celebrities, talent agencies
- 🏢 **Brands:** Companies, marketing teams, crisis management consultants

Key features:
- **Real-time monitoring** (news + social media)
- **Sentiment analysis** by topic, theme, and region
- **Geographic/Regional analysis** - heat map showing sentiment by state/region
- **Crisis & coordinated attack detection** with alerts (< 5 min)
- **AI Chat Copilot** - natural language queries ("Where is my competitor growing?")
- **Competitor/influencer analysis**
- **AI-generated response suggestions**
- **Real-time dashboard** with trends, maps, and regional insights

## Tech Stack (Confirmed 2026-05-09)

### Development Local
- **Frontend:** React 18 + TypeScript + Vite (VSCode)
  - **Maps:** Leaflet + react-leaflet v4 + OpenStreetMap (interactive geographic choropleth)
  - **Styling:** Tailwind CSS v3 + PostCSS
  - **Routing:** React Router v6
  - **HTTP:** Axios
  - **UI Components:** Custom + Tailwind utilities
- **Backend:** Node.js/Express + TypeScript (VSCode)
- **Database:** PostgreSQL (Docker local, port 5034)
- **IDE:** VSCode
- **Git:** GitHub
- **Automation:** GitHub Actions + Python/Node scripts
- **LLM:** Claude API (analysis + chat copilot)

### Production
- **Domain/DNS:** Cloudflare Registrar
- **Email:** Zoho Mail (hello@socialsense.io)
- **Frontend:** Vercel (React deployment)
- **Backend:** Railway (Node.js/Python + PostgreSQL)
- **APIs:** Claude API, NewsAPI
- **Monitoring:** Sentry, GitHub Actions
- **CI/CD:** GitHub Actions + Railway webhooks

See [docs/FINAL_STACK_CONFIRMATION.md](docs/FINAL_STACK_CONFIRMATION.md) for complete confirmation.

## Project Structure

```
social-sense/
├── CLAUDE.md (this file - project instructions for AI)
├── README.md (project overview)
├── PROJECT_STRUCTURE.md (directory guide)
├── .gitignore
│
├── config/
│   ├── .env.example (environment variables template)
│   └── docker-compose.yml (PostgreSQL + pgAdmin)
│
├── docs/
│   ├── DESIGN.md (product requirements & features)
│   ├── ARCHITECTURE.md (system design & data flow)
│   ├── IMPLEMENTATION_FEATURES.md (technical implementation details)
│   ├── API.md (external API integrations)
│   ├── SETUP_LOCAL.md (local development setup)
│   ├── EMAIL_SETUP.md (Zoho Mail configuration)
│   ├── DEPLOYMENT_GUIDE.md (production deployment)
│   ├── QUICK_START.md (quick start guide)
│   ├── STACK_CONFIRMATION.md (technology decisions)
│   ├── PHASE_SUMMARY.md (development phases)
│   └── archived/ (historical documentation)
│
├── scripts/
│   ├── init-db.sql (database initialization)
│   ├── push-and-run.sh (deploy script)
│   ├── github-setup.md (GitHub setup instructions)
│   └── github-push-commands.txt (git commands reference)
│
├── src/
│   ├── frontend/ (React + TypeScript)
│   ├── backend/ (Node.js + Express)
│   └── scripts/ (GitHub Actions, automation)
│
└── .github/
    └── workflows/ (CI/CD automation)
```

## Development Commands

Once the project is set up, common commands:

```bash
# Frontend
npm install && npm run dev          # Start React dev server (localhost:3000)
npm run build                       # Build for production
npm run lint                        # Lint & format

# Backend
npm install && npm run dev          # Start Node.js backend (localhost:5001)

# Database
docker-compose -f config/docker-compose.yml up -d     # Start PostgreSQL + pgAdmin
docker-compose -f config/docker-compose.yml down      # Stop containers

# Deploy
git push origin main                # Triggers GitHub Actions → Vercel + Railway
```

See [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md) for detailed instructions. Configuration files are in [config/](config/).

## Key Decisions & Architecture

- **Separation of concerns:** Frontend (React/Vercel), backend (Node/Python), database (PostgreSQL)
- **Event-driven:** News ingestion → analysis with Claude → alerts via GitHub Actions
- **Multi-tenant:** Support white-label for agencies (future)
- **Rate limiting:** GitHub Actions + Claude API caching to manage API costs
- **Data modeling:** Candidates/personas, sentiment scores, regional breakdown, alerts, chat history

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed diagrams and data flow.

## Important Notes

- **LGPD compliance:** All political/personal data must comply with Brazilian LGPD
- **Ethical AI:** No deepfakes, no fake news, no deceptive automation
- **Rate limiting:** Respect external API limits; use GitHub Actions scheduling
- **Multi-vertical:** Works for politics, influencers, brands - no vertical-specific code

## Start Here

1. **Understand requirements:** Read [docs/DESIGN.md](docs/DESIGN.md)
2. **Understand architecture:** Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. **Setup locally:** Follow [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)
4. **Configure email:** Follow [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)
5. **Start coding:** Work on [src/frontend/](src/frontend/) or [src/backend/](src/backend/)
6. **Deploy:** Follow [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
