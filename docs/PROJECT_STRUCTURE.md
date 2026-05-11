# Project Structure

Social Sense project organization (cleaned and organized).

```
social-sense/
├── README.md                          # Main project overview
├── CLAUDE.md                          # Project instructions for AI assistance
├── PROJECT_STRUCTURE.md               # This file
├── .gitignore                         # Git ignore rules
│
├── config/                            # Configuration files
│   ├── README.md                      # Configuration guide
│   ├── .env.example                   # Environment variables template
│   └── docker-compose.yml             # Docker Compose for local database
│
├── docs/                              # Documentation
│   ├── DESIGN.md                      # Product requirements & features
│   ├── ARCHITECTURE.md                # System design & data flow
│   ├── IMPLEMENTATION_FEATURES.md     # Technical implementation details
│   ├── API.md                         # External API integrations
│   ├── SETUP_LOCAL.md                 # Local development setup
│   ├── EMAIL_SETUP.md                 # Email configuration
│   ├── DEPLOYMENT_GUIDE.md            # Production deployment
│   ├── QUICK_START.md                 # Quick start guide
│   ├── STACK_CONFIRMATION.md          # Technology stack decisions
│   ├── PHASE_SUMMARY.md               # Development phase summary
│   └── archived/                      # Historical documentation
│       ├── README.md
│       ├── DOCUMENTATION_AUDIT_SUMMARY.md
│       ├── DOCUMENTATION_COMPLETE.md
│       └── FASE0_CHECKLIST.md
│
├── scripts/                           # Utility scripts
│   ├── README.md                      # Scripts usage guide
│   ├── init-db.sql                    # Database initialization
│   ├── push-and-run.sh                # Deploy script
│   ├── github-push-commands.txt       # GitHub commands reference
│   └── github-setup.md                # GitHub setup instructions
│
├── src/                               # Source code
│   ├── frontend/                      # React + TypeScript frontend
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── context/
│   │   └── vite.config.ts
│   │
│   ├── backend/                       # Node.js + Express backend
│   │   ├── package.json
│   │   ├── src/
│   │   │   └── main.ts
│   │   └── tsconfig.json
│   │
│   └── scripts/                       # Automation scripts (GitHub Actions, etc)
│
├── .github/                           # GitHub Actions workflows
│   └── workflows/
│
└── [HIDDEN] .DS_Store, node_modules/  # System files (gitignored)
```

## Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `config/` | Configuration & environment setup |
| `docs/` | All documentation and guides |
| `scripts/` | Utility & automation scripts |
| `src/` | Application source code |
| `.github/` | CI/CD workflows |

## Getting Started

1. **Local Development:** Follow `docs/SETUP_LOCAL.md`
2. **Quick Overview:** Read `docs/QUICK_START.md`
3. **Project Instructions:** See `CLAUDE.md`
4. **Configuration:** Check `config/README.md`

## Key Files

- **CLAUDE.md** - Project guidance for AI assistance (update when requirements change)
- **README.md** - Main project overview and features
- **docs/SETUP_LOCAL.md** - Step-by-step local development setup
- **config/.env.example** - Environment variables template

---

Last updated: 2026-05-09
