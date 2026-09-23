# Stage 1: Build React/Vite
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci \
    --maxsockets=1 \
    --fetch-retries=3 \
    --fetch-retry-mintimeout=1000 \
    --fetch-retry-maxtimeout=10000
COPY . .
RUN npm run build

# Stage 2: Serve with Caddy
FROM caddy:alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
