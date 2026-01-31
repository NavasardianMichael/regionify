# Regionify

Interactive map visualization tool for creating customizable choropleth maps with region-based data.

## Features

- **SVG Map Visualization** — Display and interact with regional maps
- **Data Import** — Import data from Excel/CSV files with smart region matching
- **Legend Configuration** — Customize legend styles, colors, and positioning
- **Export Options** — Export maps as images for presentations and reports
- **Text Similarity Matching** — Automatic association of imported data with map regions using fuzzy matching

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — Build tool
- **React Router** — Client-side routing
- **Ant Design 6** — UI components
- **Tailwind CSS 4** — Styling
- **Zustand** — State management

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Scripts

| Command        | Description               |
| -------------- | ------------------------- |
| `pnpm dev`     | Start development server  |
| `pnpm build`   | Build for production      |
| `pnpm lint`    | Run ESLint                |
| `pnpm format`  | Format code with Prettier |
| `pnpm preview` | Preview production build  |

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
