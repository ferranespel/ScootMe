#!/bin/bash

# Professional Replit Deployment Script
# This script is automatically used when you click the "Deploy" button

# Set colors for console output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'
BOLD='\033[1m'

# Capture errors
set -e

echo -e "\n${BOLD}${CYAN}[ScootMe Deployment]${RESET} Starting professional deployment process"

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check Node.js version
NODE_VERSION=$(node -v)
echo -e "Using Node.js ${NODE_VERSION}"

# 1. Set environment variables
echo -e "\n${BOLD}${CYAN}[1/5]${RESET} Setting up production environment"
export NODE_ENV=production
export PORT=5000

# 2. Install production dependencies
echo -e "\n${BOLD}${CYAN}[2/5]${RESET} Installing production dependencies"
npm ci --production

# 3. Build client application
echo -e "\n${BOLD}${CYAN}[3/5]${RESET} Building client application"
npx vite build

# 4. Process static files
echo -e "\n${BOLD}${CYAN}[4/5]${RESET} Processing static files"

# Ensure server/public directory exists
mkdir -p server/public

# Copy built files to server/public
cp -r dist/* server/public/

# Add base href to index.html if not present
INDEX_FILE="server/public/index.html"
if ! grep -q '<base href="/"' $INDEX_FILE; then
  sed -i 's/<title>/<base href="\/"><title>/' $INDEX_FILE
  echo -e "${GREEN}Added base href tag to index.html${RESET}"
fi

# 5. Start the server
echo -e "\n${BOLD}${CYAN}[5/5]${RESET} Starting production server"
echo -e "${GREEN}Deployment completed successfully!${RESET}"

# Start using CommonJS server which is more compatible
exec node server.cjs