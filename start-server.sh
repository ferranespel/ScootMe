#!/bin/bash

# Kill any existing node processes
pkill -f "node fast-start.js" || true
pkill -f "node server/index.js" || true
pkill -f "tsx server/index.ts" || true

# Start the main application
PORT=3000 tsx server/index.ts