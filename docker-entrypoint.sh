#!/bin/sh

# Start the backend in the background
echo "Starting Backend..."
cd /app/server && npm start &

# Start a simple server for the frontend or use the dev server (for production we should use nginx/serve)
echo "Starting Frontend..."
# Install 'serve' to serve the static build
npm install -g serve
serve -s /app/client/dist -l 5173
