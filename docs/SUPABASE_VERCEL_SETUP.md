# Supabase + Vercel Setup

This project keeps the frontend on Vercel and uses PostgreSQL via Supabase.
Do not commit real secrets to git.

## 1. Required environment variables

### Backend runtime (where Express API runs)
Set one of the DB URL variables below:

- `DATABASE_URL` (recommended)
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

Also set:

- `PORT=5000`
- `FRONTEND_URL=https://YOUR_VERCEL_DOMAIN`
- `CORS_ORIGIN=https://YOUR_VERCEL_DOMAIN`
- `CLAUDE_API_KEY=...`
- `NEWSAPI_KEY=...`

Notes:

- For Supabase, use a postgres URL with `sslmode=require`.
- Backend now auto-enables SSL for non-local database URLs.

### Frontend (Vercel project)

- `VITE_API_URL=https://YOUR_BACKEND_API_DOMAIN`

Optional public values (only if the frontend will call Supabase directly):

- `VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co`
- `VITE_SUPABASE_ANON_KEY=...`

## 2. Migrations

Apply migrations from backend:

```bash
cd src/backend
npm run migrate
```

This uses files in `src/backend/migrations` and writes applied entries to `schema_migrations`.

## 3. Local development

Use Docker PostgreSQL locally (`DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`) and keep production using `DATABASE_URL`.

## 4. Security checklist

- Keep `.env` files out of git.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend variables.
- Rotate keys immediately if they were ever shared in chat, logs, or screenshots.
