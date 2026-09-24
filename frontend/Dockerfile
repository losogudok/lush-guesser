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

# Stage 2: Serve through the Unix socket consumed by the host Nginx proxy.
FROM nginx:alpine
COPY --from=builder /app/dist /srv
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["sh", "-c", "umask 000 && exec nginx -g 'daemon off;'"]
