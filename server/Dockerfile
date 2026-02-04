# =============================================================================
# Multi-stage Dockerfile for Regionify Server (pnpm monorepo)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for all workspace packages
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY shared ./shared
COPY server ./server

# Generate Prisma Client (with dummy DATABASE_URL for build)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
WORKDIR /app/server
RUN pnpm exec prisma generate

# Build TypeScript
WORKDIR /app
RUN pnpm --filter @regionify/server build

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy shared source (needed at runtime for types/schemas)
COPY --from=builder /app/shared/src ./shared/src

# Copy Prisma schema and config
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/prisma.config.ts ./server/prisma.config.ts

# Generate Prisma Client in production environment
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
WORKDIR /app/server
RUN pnpm exec prisma generate

# Copy built application from builder stage
COPY --from=builder /app/server/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S regionify -u 1001

# Set ownership
RUN chown -R regionify:nodejs /app

USER regionify

EXPOSE 9002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
