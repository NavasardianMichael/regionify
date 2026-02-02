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

Automated deployment via GitHub Actions (`.github/workflows/deploy.yml`):

1. **Trigger** — Push to `master` branch
2. **Build** — Install dependencies with pnpm, build production assets
3. **Deploy** — SSH to production server with release versioning
4. **Rollback** — Keeps last 5 releases for easy rollback

### Required Secrets

| Secret     | Description                      |
| ---------- | -------------------------------- |
| `SSH_HOST` | Server IP or domain              |
| `SSH_USER` | SSH username                     |
| `SSH_KEY`  | Private SSH key                  |
| `SSH_PORT` | SSH port (optional, default: 22) |
| `APP_DIR`  | Deployment directory             |

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
