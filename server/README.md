# @regionify/server

Express.js backend API server with session-based authentication and Google OAuth.

## Tech Stack

- **Runtime**: Node.js 22+
- **Framework**: Express 5
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL + Prisma ORM
- **Session Store**: Redis
- **Authentication**: Session-based + Google OAuth 2.0
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting, Argon2

## Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

## Getting Started

### 1. Environment Setup

```bash
# From server directory
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/regionify

# Redis
REDIS_URL=redis://localhost:6379

# Session secret (generate a secure random string)
SESSION_SECRET=your-super-secret-key

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Client URL (for OAuth redirects)
CLIENT_URL=http://localhost:5183
```

### 2. Database Setup

```bash
# From root directory
pnpm db:push      # Push schema to database (development)
# OR
pnpm db:migrate   # Run migrations (production)
```

### 3. Run Development Server

```bash
# From root directory
pnpm dev:server   # Start only the server
# OR
pnpm dev          # Start both client and server
```

The server will start at `http://localhost:3000`.

## API Endpoints

### Health Check

| Method | Endpoint      | Description  |
| ------ | ------------- | ------------ |
| GET    | `/api/health` | Health check |

### Authentication

| Method | Endpoint                    | Description            | Auth Required |
| ------ | --------------------------- | ---------------------- | ------------- |
| POST   | `/api/auth/register`        | Register new user      | No            |
| POST   | `/api/auth/login`           | Login with credentials | No            |
| POST   | `/api/auth/logout`          | Logout current session | No            |
| GET    | `/api/auth/me`              | Get current user       | Yes           |
| GET    | `/api/auth/status`          | Check auth status      | No            |
| GET    | `/api/auth/google`          | Initiate Google OAuth  | No            |
| GET    | `/api/auth/google/callback` | Google OAuth callback  | No            |

### Request/Response Examples

#### Register

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatarUrl": null,
      "provider": "local",
      "createdAt": "2026-02-02T10:00:00.000Z"
    },
    "message": "Registration successful"
  }
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email address"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

## Database Management

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Create and run migrations (development)
pnpm db:migrate

# Deploy migrations (production)
pnpm db:migrate:prod

# Push schema directly (development only, resets data)
pnpm db:push

# Open Prisma Studio (database GUI)
pnpm db:studio

# Seed the database
pnpm db:seed
```

## Security Features

- **Password Hashing**: Argon2id with OWASP-recommended parameters
- **Session Security**: HttpOnly, Secure (in prod), SameSite cookies
- **Rate Limiting**: 100 req/15min general, 10 req/15min for auth
- **CORS**: Configured origins only
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Protected via parameterized queries (Prisma ORM)

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma  # Database schema
├── src/
│   ├── auth/          # Passport configuration
│   ├── config/        # Environment validation
│   ├── db/            # Prisma client setup
│   ├── lib/           # Shared utilities (logger, redis, password)
│   ├── middleware/    # Express middleware
│   ├── repositories/  # Data access layer
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic
│   ├── types/         # TypeScript declarations
│   ├── app.ts         # Express app setup
│   └── index.ts       # Entry point
└── package.json
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set authorized JavaScript origins: `http://localhost:3000`
4. Set authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`

## Development

```bash
# Type checking
pnpm --filter @regionify/server typecheck

# Linting
pnpm --filter @regionify/server lint

# Watch mode (auto-restart on changes)
pnpm --filter @regionify/server dev
```

## Production Deployment

1. Build the server:

   ```bash
   pnpm build:server
   ```

2. Set production environment variables:
   - `NODE_ENV=production`
   - Strong `SESSION_SECRET`
   - Production database/Redis URLs
   - Update `CORS_ORIGINS` and `CLIENT_URL`

3. Run migrations:

   ```bash
   pnpm db:migrate:prod
   ```

4. Start the server:
   ```bash
   node server/dist/index.js
   ```
