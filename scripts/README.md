# Scripts Directory

Utility scripts for development, deployment, and automation.

## Files

- **`init-db.sql`** - Database initialization script. Creates all tables, indexes, and seeds initial data.
- **`push-and-run.sh`** - Bash script to push changes and run the project locally.
- **`db-backup.sh`** - Creates compressed PostgreSQL backups in `backups/db/`.
- **`git-sync.sh`** - Pull/rebase + commit + push with DB backup executed first.
- **`setup-git-hooks.sh`** - Configures `core.hooksPath` to enable repository hooks.
- **`github-push-commands.txt`** - Reference commands for pushing to GitHub.
- **`github-setup.md`** - Instructions for setting up GitHub repository and Actions.

## Usage

### Database Setup
```bash
# Docker will automatically run init-db.sql when starting PostgreSQL
docker-compose -f config/docker-compose.yml up -d
```

### Deploy to Production
```bash
bash scripts/push-and-run.sh
```

### DB Migrations (versioned)
```bash
cd src/backend
npm run migrate
```

### Sync with automatic backup
```bash
# One-time per clone: enable hooks tracked in this repo
bash scripts/setup-git-hooks.sh

# Daily sync command (backup runs before push)
bash scripts/git-sync.sh "chore: your message"
```

### GitHub Setup
See `scripts/github-setup.md` for detailed instructions on:
- Creating a new GitHub repository
- Configuring GitHub Actions
- Setting up Vercel and Railway deployments
