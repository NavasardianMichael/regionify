# syntax=docker/dockerfile:1

# Base stage with pnpm
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY server/prisma ./server/prisma

RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY shared ./shared
COPY server ./server

# Generate Prisma client and build
RUN pnpm --filter @regionify/server build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 regionify

# Copy package files for production install
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/shared/src ./shared/src
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma

# Install pnpm and production dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Generate Prisma client in production
WORKDIR /app/server
RUN pnpm db:generate

# Set ownership
RUN chown -R regionify:nodejs /app

USER regionify

EXPOSE 9002

CMD ["node", "dist/index.js"]
