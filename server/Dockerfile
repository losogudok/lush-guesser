# Stage 1: Build NestJS
FROM node:24-slim AS builder
RUN npm install --global pnpm@12.14.0

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile \
    --network-concurrency=1
COPY . .
RUN pnpm run build

# Prune devDependencies to keep production image small
RUN pnpm prune --prod

# Stage 2: Run Production
FROM node:24-slim
WORKDIR /app

# Copy package info and compiled resources from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Bundled starter ingredient images for the catalog seed script
COPY --from=builder /app/assets ./assets

# Create database volume directory
RUN mkdir -p /app/data
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/main.js"]
