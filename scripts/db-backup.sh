#!/usr/bin/env bash

# Creates a compressed PostgreSQL backup in backups/db before sync/push.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/db}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="$BACKUP_DIR/socialsense_${TIMESTAMP}.sql.gz"

load_env_file() {
  local file_path="$1"
  if [[ -f "$file_path" ]]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$file_path" | sed '/^$/d' | xargs) || true
  fi
}

load_env_file "$ROOT_DIR/config/.env"
load_env_file "$ROOT_DIR/src/backend/.env"

mkdir -p "$BACKUP_DIR"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "[db-backup] Error: pg_dump not found. Install PostgreSQL client tools."
  exit 1
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[db-backup] Using DATABASE_URL"
  pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "$BACKUP_FILE"
else
  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-5432}"
  DB_USER="${DB_USER:-postgres}"
  DB_NAME="${DB_NAME:-socialsense}"

  if [[ -z "${DB_PASSWORD:-}" ]]; then
    echo "[db-backup] Warning: DB_PASSWORD not set. Trying without password env."
    pg_dump --no-owner --no-privileges -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
  else
    PGPASSWORD="$DB_PASSWORD" pg_dump --no-owner --no-privileges -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
  fi
fi

# Keep only the most recent 30 backups.
backup_list="$(ls -1t "$BACKUP_DIR"/socialsense_*.sql.gz 2>/dev/null || true)"
if [[ -n "$backup_list" ]]; then
  file_index=0
  while IFS= read -r backup_path; do
    file_index=$((file_index + 1))
    if [[ $file_index -gt 30 ]]; then
      rm -f "$backup_path"
    fi
  done <<< "$backup_list"
fi

echo "[db-backup] Backup created: $BACKUP_FILE"
