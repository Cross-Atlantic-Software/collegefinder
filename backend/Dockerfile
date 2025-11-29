# Dockerfile - Supports both development and production
# Usage:
#   Development: docker build --build-arg NODE_ENV=development -t backend:dev .
#   Production:  docker build --build-arg NODE_ENV=production -t backend:prod .
#   Or use docker-compose which sets NODE_ENV automatically

FROM node:20-alpine

WORKDIR /app

# Build argument to determine environment
ARG NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies based on environment
# Development: install all (including nodemon for hot-reload)
# Production: install only production dependencies (smaller image)
RUN if [ "$NODE_ENV" = "development" ]; then \
      npm ci; \
    else \
      npm ci --only=production; \
    fi

# Copy application code
COPY . .

# Expose port
EXPOSE 5001

# Set default command (can be overridden in docker-compose)
# Development uses: npm run dev (nodemon)
# Production uses: node server.js
CMD ["node", "server.js"]
