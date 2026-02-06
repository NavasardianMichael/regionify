# =============================================================================
# Multi-stage Dockerfile for Regionify Server (pnpm monorepo)
# =============================================================================

# -----------------------------------------------------------------------------
# Base: Common setup for all stages
# -----------------------------------------------------------------------------
FROM node:lts-alpine AS base

RUN apk add --no-cache libc6-compat && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install deps, generate Prisma, compile TypeScript
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy package files and prisma schema (needed for postinstall)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY server/prisma ./server/prisma

# Install all dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY shared ./shared
COPY server ./server

# Build shared package first, then server
RUN pnpm --filter @regionify/shared build && pnpm --filter @regionify/server build

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM base AS runtime

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Copy Prisma schema (needed for generate)
COPY --from=builder /app/server/prisma ./server/prisma

# Install production dependencies only (ignore scripts to skip husky)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# Generate Prisma client for runtime
WORKDIR /app/server
RUN pnpm exec prisma generate
WORKDIR /app

# Copy shared dist and built server
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

# Create non-root user and set ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S regionify -u 1001 && \
    chown -R regionify:nodejs /app

USER regionify
WORKDIR /app/server

EXPOSE 9002

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9002/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js"]
