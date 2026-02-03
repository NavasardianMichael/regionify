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
# Push schema to database (development)
pnpm db:push

# Or create a migration (production)
pnpm db:migrate
```

### Development

```bash
# Start both client and server
pnpm dev

# Start only client
pnpm dev:client

# Start only server
pnpm dev:server
```

- Client: http://localhost:5183
- Server: http://localhost:3000

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

Automated deployment on push to `master`:

1. **Build** — Install dependencies, build client and server
2. **Deploy Client** — Static files to `$APP_DIR/client/releases/`
3. **Deploy Server** — Node.js app to `$APP_DIR/server/releases/`
4. **Migrate** — Run Prisma database migrations
5. **Restart** — Reload PM2 application

### Server Directory Structure

```
$APP_DIR/
├── client/
│   ├── releases/           # Versioned client builds
│   └── current -> releases/abc123
├── server/
│   ├── releases/           # Versioned server builds
│   └── current -> releases/abc123
├── shared/
│   ├── .env                # Environment variables
│   └── ecosystem.config.cjs # PM2 configuration
└── logs/
    ├── error.log
    └── out.log
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

### Server Setup

1. Install Node.js 24+, PM2, and Nginx
2. Create app directory: `mkdir -p $APP_DIR/{client,server,shared,logs}`
3. Copy `server/ecosystem.config.cjs` to `$APP_DIR/shared/` and update paths
4. Configure Nginx to serve from `$APP_DIR/client/current` and proxy `/api` to `localhost:3000`
5. Set up GitHub secrets and push to master

### Rollback

Keep last 5 releases. To rollback manually:

```bash
cd $APP_DIR/server
ln -sfn releases/<previous-sha> current
pm2 reload regionify
```

## Project Structure

```
src/
├── api/           # API modules
├── assets/        # Static assets (images, maps)
├── components/    # Reusable UI components
├── constants/     # Application constants
├── helpers/       # Utility functions
├── hooks/         # Custom React hooks
├── pages/         # Route page components
├── store/         # Zustand state management
├── styles/        # Global styles and themes
└── types/         # TypeScript types
```
