# =============================================================================
# Multi-stage Dockerfile for Regionify Server (pnpm monorepo)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install deps, generate Prisma, compile TypeScript
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files and prisma schema (needed for postinstall)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY client/package.json ./client/
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY server/prisma ./server/prisma

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY shared ./shared
COPY server ./server

# Build shared first, then server
RUN pnpm --filter @regionify/shared build && pnpm --filter @regionify/server build

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

RUN apk add --no-cache libc6-compat && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files and prisma schema
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY client/package.json ./client/
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma

# Install production dependencies (ignore scripts to skip husky)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts


# Generate Prisma client
WORKDIR /app/server
RUN pnpm exec prisma generate
WORKDIR /app

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

# Run migrations at container start, then start server
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/index.js"]
