# Scripts Directory

Utility scripts for development, deployment, and automation.

## Files

- **`init-db.sql`** - Database initialization script. Creates all tables, indexes, and seeds initial data.
- **`push-and-run.sh`** - Bash script to push changes and run the project locally.
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

### GitHub Setup
See `scripts/github-setup.md` for detailed instructions on:
- Creating a new GitHub repository
- Configuring GitHub Actions
- Setting up Vercel and Railway deployments
