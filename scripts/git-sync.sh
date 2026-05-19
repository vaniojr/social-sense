#!/usr/bin/env bash

# Sync local branch with GitHub while guaranteeing DB backup first.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_MSG="${1:-chore: sync changes}"

bash "$ROOT_DIR/scripts/db-backup.sh"

git pull --rebase origin main
git add -A

if git diff --cached --quiet; then
  echo "[git-sync] No staged changes to commit."
else
  git commit -m "$COMMIT_MSG"
fi

git push origin main

echo "[git-sync] Sync completed."
