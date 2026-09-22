# Stage 1: Build NestJS and compile SQLite3
FROM node:24-slim AS builder

# Install build dependencies for compiling native node modules (sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci \
    --maxsockets=1 \
    --fetch-retries=3 \
    --fetch-retry-mintimeout=1000 \
    --fetch-retry-maxtimeout=10000
COPY . .
RUN npm run build

# Prune devDependencies to keep production image small
RUN npm prune --production

# Stage 2: Run Production
FROM node:24-slim
WORKDIR /app

# Copy package info and compiled resources from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create database volume directory
RUN mkdir -p /app/data
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/main.js"]
