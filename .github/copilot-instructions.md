# Regionify - Shared Development Rules for AI Agents

## Monorepo Structure

This is a pnpm monorepo with three packages:

- `client/` - React frontend (@regionify/client)
- `server/` - Express backend (@regionify/server)
- `shared/` - Shared types and schemas (@regionify/shared)

**See also:**

- `.github/copilot-instructions-client.md` - Frontend-specific rules
- `.github/copilot-instructions-server.md` - Backend-specific rules

---

## Core Rules (All Packages)

- Before creating or modifying code, always inspect existing files in the same domain/folder and follow the established structure, naming, and patterns exactly. Do not invent new patterns.
- Add comments only when the code's purpose is not immediately clear from its context or naming.
- Keep files small and focused; split when complexity grows.

## TypeScript Rules (All Packages)

- No `any` without explicit justification.
- Explicit types for function params and return values.
- Use `type` for object shapes, `interface` for extendable contracts.
- Prefer `type` imports: `import { type MyType } from './types'`.
- Always handle `null` and `undefined` cases explicitly.

## Code Style (All Packages)

- Named exports preferred unless existing code uses default.
- Import order: enforced by `simple-import-sort/imports` ESLint rule.
- Destructure parameters in function signatures.
- Prefer early returns for cleaner code flow.

## Error Handling (All Packages)

- All async operations must handle errors.
- Never swallow errors silently.
- Use shared error types from `@regionify/shared`.

## Git Commits

- Clear, descriptive commit messages.
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Keep commits atomic and focused.
- When user says "commit", run git commands in terminal (not GitKraken MCP tools).

Examples:

- `feat(auth): add password reset functionality`
- `fix(client): handle empty state in map viewer`
- `refactor(shared): extract validation schemas`

## Shared Package (@regionify/shared)

Contains types, schemas, and constants used by both client and server:

```
shared/src/
├── schemas/     # Zod validation schemas
├── types/       # TypeScript types and interfaces
└── constants/   # Shared constants (HttpStatus, ErrorCode)
```

### Usage

```typescript
// Import types
import { type UserPublic, type ApiResponse } from '@regionify/shared';

// Import schemas
import { loginSchema, registerSchema } from '@regionify/shared/schemas';

// Import constants
import { HttpStatus, ErrorCode } from '@regionify/shared';
```

## Forbidden (All Packages)

- Using `any` without justification
- Introducing new patterns without precedent in the codebase
- Duplicating existing functionality
- Ignoring ESLint/TypeScript warnings

## AI Agent Behavior

- When the user says "it's best practice" or similar phrases indicating a new best practice, automatically add the mentioned practice as a new bullet point to the "Custom Best Practices" section in the appropriate file (client/server/shared).
- Keep entries concise and actionable.

## Infrastructure

### Docker Services

Run `docker compose up -d` to start local development services:

- **PostgreSQL** (port 5432) - Main database
- **Redis** (port 6379) - Session storage

### Environment Setup

1. Copy `.env.example` to `.env` in the server package
2. Start Docker services: `docker compose up -d`
3. Push database schema: `pnpm --filter @regionify/server db:push`
4. Start development: `pnpm dev`
