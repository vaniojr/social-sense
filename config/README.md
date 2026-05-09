# Configuration Directory

This directory contains all project configuration files.

## Files

- **`.env.example`** - Template for environment variables. Copy to `.env` for local development.
- **`docker-compose.yml`** - Docker Compose configuration for local PostgreSQL + pgAdmin setup.

## Quick Start

1. Copy `.env.example` to `.env` in the root directory:
   ```bash
   cp config/.env.example .env
   ```

2. Update `.env` with your API keys and database credentials

3. Start PostgreSQL locally:
   ```bash
   docker-compose -f config/docker-compose.yml up -d
   ```

4. Access pgAdmin at `http://localhost:5050` (default user: admin@pgadmin.org, password: admin)
