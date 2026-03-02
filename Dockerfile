# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy root package.json if it exists, otherwise just build client
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy backend code
COPY server/ ./server/

# Copy frontend build from previous stage to be served by express or a separate server
# Note: Since the backend is currently configured as a separate API, we'll keep both.
COPY --from=build /app/client/dist ./client/dist

# Expose ports
EXPOSE 5000
EXPOSE 5173

# We will use a small script to run both
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"]
