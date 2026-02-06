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

# Build TypeScript (includes prisma generate via build script)
RUN pnpm --filter @regionify/server build

# Prune dev dependencies, keep only production deps
RUN pnpm prune --prod

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy pruned node_modules from builder (already has Prisma client generated)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/node_modules ./shared/node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy package files (for Node resolution)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/package.json ./server/

# Copy Prisma schema and generated client
COPY --from=builder /app/server/prisma ./server/prisma

# Copy shared source and built server
COPY --from=builder /app/shared/src ./shared/src
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
