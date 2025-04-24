#!/bin/bash

# Production deployment script for Replit

# Set colors for console output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RESET='\033[0m'
BOLD='\033[1m'

echo -e "\n${BOLD}${CYAN}[1]${RESET} Preparing for deployment"

# Ensure environment is set to production
export NODE_ENV=production
export PORT=5000

# Make sure required directories exist
echo -e "\n${BOLD}${CYAN}[2]${RESET} Ensuring directories exist"
mkdir -p server/public

# Build the client
echo -e "\n${BOLD}${CYAN}[3]${RESET} Building client for production"
npm run build

# Copy built files to server/public
echo -e "\n${BOLD}${CYAN}[4]${RESET} Copying built files to server/public"
cp -r dist/* server/public/

# Add error handling to index.html
echo -e "\n${BOLD}${CYAN}[5]${RESET} Adding error handling to index.html"
INDEX_FILE="server/public/index.html"

# Add base href if not present
if ! grep -q '<base href="/"' $INDEX_FILE; then
  sed -i 's/<title>/<base href="\/"><title>/' $INDEX_FILE
  echo -e "${GREEN}Added base href to index.html${RESET}"
fi

# Start the application
echo -e "\n${BOLD}${CYAN}[6]${RESET} Starting the application"
npm run start