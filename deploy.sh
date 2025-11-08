#!/bin/bash

echo "=========================================="
echo "Deploying Mobile Travel App Backend"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REMOTE_USER="root"
REMOTE_HOST="72.60.234.16"
REMOTE_DIR="/root/mobile-travel-app-backend"
APP_NAME="api"

echo -e "${YELLOW}Step 1: Building application locally...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Aborting deployment.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

echo -e "${YELLOW}Step 2: Uploading files to server...${NC}"

# Upload dist folder
echo "Uploading dist folder..."
rsync -avz --delete ./dist/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/dist/

# Upload package.json and package-lock.json
echo "Uploading package files..."
scp package.json package-lock.json ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

# Upload .env file if exists
if [ -f .env ]; then
    echo "Uploading .env file..."
    scp .env ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
fi

# Upload prisma schema
echo "Uploading prisma schema..."
scp -r prisma ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo -e "${GREEN}✓ Files uploaded${NC}"
echo ""

echo -e "${YELLOW}Step 3: Installing dependencies on server...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /root/mobile-travel-app-backend
echo "Installing dependencies..."
npm install --omit=dev
echo "✓ Dependencies installed"
ENDSSH

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 4: Restarting application...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /root/mobile-travel-app-backend
echo "Restarting PM2 process..."
pm2 restart api
echo "Waiting for app to start..."
sleep 3
pm2 status
ENDSSH

echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

echo -e "${YELLOW}Step 5: Checking logs...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
pm2 logs api --lines 30 --nostream
ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "==========================================${NC}"
echo ""
echo "To monitor logs, run:"
echo "  ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 logs api'"
