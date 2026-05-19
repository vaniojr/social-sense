import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const { Client } = pg

dotenv.config({ path: path.resolve(process.cwd(), '../../config/.env') })
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.resolve(__dirname, '../../migrations')

function buildConnectionConfig() {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    }
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'socialsense',
  }
}

async function ensureMigrationTable(client: InstanceType<typeof Client>) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `)
}

async function getAppliedMigrations(client: InstanceType<typeof Client>) {
  const result = await client.query<{ filename: string }>('SELECT filename FROM schema_migrations ORDER BY filename;')
  return new Set(result.rows.map((row) => row.filename))
}

async function run() {
  const client = new Client(buildConnectionConfig())

  await client.connect()

  try {
    await ensureMigrationTable(client)

    const entries = await fs.readdir(migrationsDir)
    const migrationFiles = entries.filter((file) => file.endsWith('.sql')).sort()
    const appliedMigrations = await getAppliedMigrations(client)

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`[migrate] Skipping already applied migration: ${file}`)
        continue
      }

      const filePath = path.join(migrationsDir, file)
      const sql = await fs.readFile(filePath, 'utf8')

      console.log(`[migrate] Applying: ${file}`)
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
      console.log(`[migrate] Applied: ${file}`)
    }

    console.log('[migrate] Migration process completed successfully.')
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error('[migrate] Migration failed:', error)
  process.exit(1)
})
