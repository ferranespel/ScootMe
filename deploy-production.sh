#!/bin/bash

# Production deployment script for Replit

# Set colors for console output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'
BOLD='\033[1m'

echo -e "\n${BOLD}${CYAN}[1]${RESET} Preparing for production deployment"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${RESET}"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v)
echo -e "Using Node.js version: ${NODE_VERSION}"

# Set environment variables
export NODE_ENV=production
export PORT=5000

echo -e "\n${BOLD}${CYAN}[2]${RESET} Building client for production"
echo -e "${YELLOW}This may take a few minutes...${RESET}"

# Install production dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "Installing dependencies..."
    npm install --production
fi

# Build the client
npm run build

# Check if build succeeded
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed - dist directory not found${RESET}"
    exit 1
fi

echo -e "\n${BOLD}${CYAN}[3]${RESET} Preparing server/public directory"

# Ensure server/public directory exists
mkdir -p server/public

# Copy built files to server/public
cp -r dist/* server/public/

# Check if index.html exists in server/public
if [ ! -f "server/public/index.html" ]; then
    echo -e "${RED}Error: server/public/index.html not found after copying${RESET}"
    exit 1
fi

echo -e "\n${BOLD}${CYAN}[4]${RESET} Modifying index.html for production"

# Add base href if not present
if ! grep -q '<base href="/"' server/public/index.html; then
    sed -i 's/<title>/<base href="\/"><title>/' server/public/index.html
    echo -e "${GREEN}Added base href to index.html${RESET}"
fi

echo -e "\n${BOLD}${CYAN}[5]${RESET} Starting production server"

# Use CommonJS server for compatibility
node server.cjs