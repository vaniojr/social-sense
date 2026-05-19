#!/usr/bin/env bash

# Configures repository hooks to enforce DB backup before push.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks

echo "installed" > .githooks/.installed

echo "[hooks] core.hooksPath configured to .githooks"

echo "[hooks] Pre-push DB backup is now active for this clone."
