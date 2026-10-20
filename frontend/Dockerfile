# Stage 1: Build React/Vite
FROM node:24-slim AS builder
RUN npm install --global pnpm@12.14.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile \
    --network-concurrency=1
COPY . .
RUN pnpm run build

# Stage 2: Serve with Caddy
FROM caddy:alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
