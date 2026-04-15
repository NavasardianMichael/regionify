# Regionify

Interactive map visualization tool for creating customizable choropleth maps with region-based data.

## Features

- **SVG Map Visualization** — Display and interact with regional maps
- **Data Import** — Import data from Excel/CSV files with smart region matching
- **Legend Configuration** — Customize legend styles, colors, and positioning
- **Export Options** — Export maps as images for presentations and reports
- **Text Similarity Matching** — Automatic association of imported data with map regions using fuzzy matching
- **User Authentication** — Session-based auth with Google OAuth support

## Monorepo Structure

```
regionify/
├── client/           # React frontend (@regionify/client)
├── server/           # Express backend (@regionify/server)
├── shared/           # Shared types & schemas (@regionify/shared)
├── package.json      # Root workspace config
└── pnpm-workspace.yaml
```

## Tech Stack

### Frontend (client/)

- **React 19** + **TypeScript**
- **Vite** — Build tool
- **React Router** — Client-side routing
- **Ant Design 6** — UI components
- **Tailwind CSS 4** — Styling
- **Zustand** — State management
- **Sentry** — Client-side error tracking

### Backend (server/)

- **Express 5** + **TypeScript**
- **Prisma ORM** — PostgreSQL database
- **Redis** — Session store
- **Passport** — Google OAuth
- **Zod** — Validation

### Shared (shared/)

- Common TypeScript types
- Zod validation schemas

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker & Docker Compose (for PostgreSQL & Redis)

### Installation

```bash
# Install all dependencies
pnpm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

### Docker Services

Start PostgreSQL and Redis with Docker:

```bash
# Start services in background
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Database Setup

```bash
# Push schema to database (development) — required before auth/OAuth will work
pnpm db:push

# Or create a migration (production)
pnpm db:migrate
```

If Google OAuth redirects with `error=google_auth_failed` and the API logs show Prisma **`P2021` / table does not exist**, the database schema was never applied; run `pnpm db:push` with Docker Postgres running.

### Development

```bash
# Start both client and server
pnpm dev

# Start only client
pnpm dev:client

# Start only server
pnpm dev:server
```

- Client: http://localhost:7002
- Server: http://localhost:9002

### Production Build

```bash
# Build all packages
pnpm build

# Build individual packages
pnpm build:client
pnpm build:server
```

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `pnpm dev`        | Start client and server        |
| `pnpm dev:client` | Start client only              |
| `pnpm dev:server` | Start server only              |
| `pnpm build`      | Build all packages             |
| `pnpm lint`       | Run ESLint across all packages |
| `pnpm format`     | Format code with Prettier      |
| `pnpm typecheck`  | Type-check all packages        |
| `pnpm db:push`    | Push schema to database        |
| `pnpm db:migrate` | Run database migrations        |
| `pnpm db:studio`  | Open Drizzle Studio            |

## CI/CD Pipeline

### Continuous Integration (`.github/workflows/ci.yml`)

Runs on pull requests to `master`:

- **Lint** — ESLint and Prettier checks
- **Type Check** — TypeScript validation
- **Build** — Verify production build succeeds

### Continuous Deployment (`.github/workflows/deploy.yml`)

Automated deployment on push to `master` (with path filters: client-only / server-only / both; see workflow file):

1. **Detect changes** — Which of client / server (or both) need a deploy
2. **Build / client** (if needed) — `pnpm build:client`, static tarball
3. **Build / server** (if needed) — Client + server build for Docker, image verify, server tarball
4. **Deploy** — Server first (when applicable), then client: see layout below
5. **Migrate** — Container `entrypoint.sh` runs `prisma migrate deploy` before Node starts
6. **Runtime** — API container (e.g. port **9002**), Postgres, Redis

### Server directory structure (production)

`APP_DIR` is the secret you set in GitHub (e.g. `/home/michael/apps/regionify`). Run Docker Compose from **`$APP_DIR/server/current`** (symlink to `server/releases/<git-sha>`).

```
$APP_DIR/
├── client/
│   ├── releases/<git-sha>/   # Static files (index.html, assets/)
│   └── current -> releases/<git-sha>
└── server/
    ├── .env.production       # persistent; updated each server deploy
    ├── releases/<git-sha>/   # extracted server tarball (compose root)
    │   ├── docker-compose.prod.yml
    │   ├── package.json
    │   ├── server/
    │   ├── shared/
    │   └── client/           # dist (+ package) for the image build
    └── current -> releases/<git-sha>
```

Useful checks (SSH in, then):

```bash
cd "$APP_DIR/server/current"
export REGIONIFY_ENV_FILE="$APP_DIR/server/.env.production"
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec server printenv CLIENT_STATIC_DIR
curl -sS http://127.0.0.1:9002/health
```

**`printenv CLIENT_STATIC_DIR` must print `/app/client/dist/client`** after `docker compose` picks up the repo’s `environment:` block (redeploy or `docker compose up -d server` with the updated compose file). **`/health` = 200 but `/` = 404** usually means this variable was unset — the API runs, HTML/static routes are not mounted.

**Browser shows 500 and nginx error log says** _rewrite or internal redirection cycle … `/index.html`_ — that is **nginx static config** (bad `try_files` / `error_page` combo, wrong `root`, or missing `index.html` under `client/current`). Fix nginx, then verify:

```bash
ls -la "$APP_DIR/client/current/index.html"
sudo tail -20 /var/log/nginx/error.log
```

### Required GitHub Secrets

| Secret            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `SSH_HOST`        | Server IP or domain                                      |
| `SSH_USER`        | SSH username                                             |
| `SSH_KEY`         | Private SSH key                                          |
| `SSH_PORT`        | SSH port (optional, default: 22)                         |
| `APP_DIR`         | Deployment directory (e.g., `/home/user/apps/regionify`) |
| `ENV_FILE_BASE64` | Base64-encoded server .env file                          |

### Optional GitHub Secrets

| Secret              | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `VITE_SENTRY_DSN`   | Sentry DSN for client error tracking. Omit to disable.                   |
| `SENTRY_ORG`        | Sentry organization slug (for source-map uploads during client build)    |
| `SENTRY_PROJECT`    | Sentry project slug                                                      |
| `SENTRY_AUTH_TOKEN` | Sentry org auth token (`org:ci` scope). Omit to skip source-map uploads. |

### Server setup

1. Install Docker with Compose plugin, and Nginx (for TLS + static SPA + reverse proxy to the API).
2. Create layout: `mkdir -p $APP_DIR/client/releases $APP_DIR/server/releases` (the first server deploy fills `server/releases/<sha>` and `server/current`).
3. Configure Nginx to serve the SPA from `$APP_DIR/client/current` and proxy API traffic to **`127.0.0.1:9002`** (see `deployment/nginx-spa-and-api.example.conf`; adjust if `PORT` or paths differ). Avoid combining `error_page 404 = /index.html` with `try_files … /index.html` in a way that internally loops on `/index.html`.
4. **Public embed SSR:** `GET /embed/<token>` is rendered by Express with the project’s SEO title, description, keywords, `<h1>`, and JSON-LD. The example Nginx config proxies `^/embed/[^/]+$` to Node **before** the `location /` `try_files` block so embed URLs are not served as the generic SPA `index.html`.
5. **Verify embed HTML (production):** `curl -sS 'https://your-domain/embed/<token>' | head -c 2500` — expect `<main>`, an `<h1>` matching the embed SEO title, and `application/ld+json` with the same `name` / `description` (and `keywords` when set). If the response matches your static home `index.html` title instead, the embed `location` is not proxying to Node.
6. Set GitHub secrets (`APP_DIR`, `SSH_*`, `ENV_FILE_BASE64`, `VITE_API_BASE_URL`, …) and push to `master`.

### Rollback

Client static files: repoint `current` to a previous release under `$APP_DIR/client/releases/`.  
Server: rebuild/redeploy a previous git SHA from CI, or repoint `server/current` to `releases/<old-sha>` and `docker compose up -d` from `$APP_DIR/server/current`.

## Project Structure

pnpm monorepo (see root `package.json` and `pnpm-workspace.yaml`). Build outputs (`dist/`, `node_modules/`) are omitted.

```
regionify/
├── .github/              # GitHub Actions workflows
├── client/               # React 19 + Vite SPA (@regionify/client)
│   └── src/
│       ├── api/          # API client modules
│       ├── assets/       # Static assets (images, maps, …)
│       ├── components/   # Reusable UI
│       ├── constants/
│       ├── data/
│       ├── helpers/
│       ├── hooks/
│       ├── i18n/
│       ├── locales/      # i18n message catalogs
│       ├── pages/        # Route-level pages
│       ├── store/        # Zustand
│       ├── styles/       # Global styles / theme hooks
│       └── types/
├── server/               # Express API + Prisma (@regionify/server)
│   ├── prisma/
│   ├── scripts/
│   └── src/
│       ├── auth/
│       ├── config/
│       ├── db/
│       ├── lib/
│       ├── middleware/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── web/          # Embed / SSR HTML helpers
├── shared/               # Shared package (@regionify/shared)
│   └── src/
│       ├── constants/
│       ├── schemas/
│       └── types/
├── deployment/           # Example production nginx config
├── docs/                 # Additional documentation
├── scripts/              # Root tooling (e.g. lint-staged helpers)
├── docker-compose.prod.yml
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```
