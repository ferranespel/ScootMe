#!/bin/bash

# Check if the main server is already running on port 5000
if lsof -i :5000 -t &>/dev/null; then
  echo "ScootMe server is already running on port 5000"
  
  # Start the preview server on port 8080 (for Replit's webview)
  echo "Starting preview server on port 8080..."
  node run-preview.cjs
else
  echo "ScootMe server is not running. Starting it now..."
  
  # Kill any existing preview servers
  pkill -f "node run-preview.cjs" || true
  
  # Start the preview server only since the main app is already running
  # This will provide links to the main app
  node run-preview.cjs
fi