#!/bin/bash

# Production build script for Replit deployment

# Set colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "\n${BOLD}${CYAN}[1]${RESET} Preparing for production build"

# Check if we have the npm command
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed or not in PATH${RESET}"
    exit 1
fi

# Ensure server/public directory exists
mkdir -p server/public

# Build client for production
echo -e "\n${BOLD}${CYAN}[2]${RESET} Building client-side code"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Client build failed${RESET}"
    exit 1
fi

# Check for client build output
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Warning: No 'dist' directory found after build. Creating fallback...${RESET}"
    mkdir -p dist
    
    # Create a minimal fallback index.html
    cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScootMe - Fallback</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            margin-bottom: 1rem;
        }
        p {
            margin: 0.5rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ScootMe</h1>
        <p>This is a fallback page for ScootMe. The application is currently in deployment mode.</p>
        <p>Please try again in a few minutes or contact support if the issue persists.</p>
    </div>
</body>
</html>
EOF
else
    echo -e "${GREEN}Client build completed successfully${RESET}"
fi

# Copy built files to server/public
echo -e "\n${BOLD}${CYAN}[3]${RESET} Copying static files to server/public"
if [ -d "dist" ]; then
    cp -r dist/* server/public/
    echo -e "${GREEN}Copied build files to server/public${RESET}"
else
    echo -e "${RED}Error: No build files to copy${RESET}"
    exit 1
fi

# Ensure development can continue
echo -e "\n${BOLD}${CYAN}[4]${RESET} Setting up for development"
echo -e "${YELLOW}Important: When testing the app, make sure to restart the workflow after deployment${RESET}"

echo -e "\n${BOLD}${GREEN}✓ Production build completed${RESET}"
echo -e "You can now deploy your application by clicking the 'Deploy' button."