#!/bin/bash

# Social Sense - GitHub Push + Local Execution Script
# Usage: ./PUSH_AND_RUN.sh https://github.com/YOUR_USERNAME/social-sense.git

set -e

REPO_URL=$1

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL is required"
    echo ""
    echo "Usage: ./PUSH_AND_RUN.sh https://github.com/YOUR_USERNAME/social-sense.git"
    echo ""
    echo "Steps:"
    echo "1. Create repository at https://github.com/new"
    echo "2. Copy the repository URL"
    echo "3. Run this script with the URL"
    exit 1
fi

PROJECT_DIR="/Users/vaniojr/Library/CloudStorage/GoogleDrive-vaniojr@gmail.com/My Drive/Projects/social-sense"

cd "$PROJECT_DIR"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       SOCIAL SENSE - GitHub Push + Local Execution        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# STEP 1: Git Push
# ============================================================
echo "📤 STEP 1: Pushing to GitHub..."
echo "Repository: $REPO_URL"
echo ""

git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
git push -u origin main

echo ""
echo "✅ GitHub push successful!"
echo "🔗 Repository: $REPO_URL"
echo ""

# ============================================================
# STEP 2: Docker
# ============================================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  STEP 2: Starting Docker (PostgreSQL + pgAdmin)           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

echo ""
echo "🔍 Checking Docker status..."
docker ps | grep -E "socialsense-db|socialsense-pgadmin"

echo ""
echo "✅ Docker is running!"
echo "📊 pgAdmin: http://localhost:5050"
echo "   Email: admin@example.com | Password: admin"
echo ""

# ============================================================
# STEP 3: Instructions for terminals
# ============================================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           STEP 3: Start Backend + Frontend                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Open 2 new terminal tabs/windows and run:"
echo ""
echo "TAB 2 - BACKEND:"
echo "  cd \"$PROJECT_DIR/src/backend\""
echo "  npm install"
echo "  npm run dev"
echo ""
echo "TAB 3 - FRONTEND:"
echo "  cd \"$PROJECT_DIR/src/frontend\""
echo "  npm install"
echo "  npm run dev"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "When both are running, verify:"
echo ""
echo "✅ Frontend:  http://localhost:3000"
echo "   Should show Social Sense dashboard with green status boxes"
echo ""
echo "✅ Backend:   http://localhost:5000/api/health"
echo "   Should return: {\"status\":\"ok\", ...}"
echo ""
echo "✅ Database:  http://localhost:5050 (pgAdmin)"
echo "   Email: admin@example.com | Password: admin"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete! See verification steps above.         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
