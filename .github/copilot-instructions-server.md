# Server Development Rules for AI Agents

**See `.github/copilot-instructions.md` for shared rules.**

## Stack

- Node.js 22+ with native ES modules
- Express 5 + TypeScript 5.9
- Prisma ORM + PostgreSQL
- Redis for sessions
- Zod for validation
- Passport for OAuth

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma  # Database schema definition
├── src/
│   ├── auth/          # Authentication strategies (Passport)
│   ├── config/        # Environment & app configuration
│   ├── db/            # Prisma client setup
│   ├── lib/           # Shared utilities (logger, redis, password)
│   ├── middleware/    # Express middleware
│   ├── repositories/  # Data access layer (database queries)
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic layer
│   ├── types/         # TypeScript declarations
│   ├── app.ts         # Express app configuration
│   └── index.ts       # Server entry point
```

## Path Aliases

Use `@/` prefix for absolute imports within server:

```typescript
import { db } from '@/db/index.js';
import { logger } from '@/lib/logger.js';
```

**Note**: Always use `.js` extension in imports for Node.js ES modules compatibility.

## Core Rules

- Before creating or modifying code, inspect existing files in the same domain and follow established patterns exactly.
- All files must use ES module syntax (`import`/`export`).
- Use `.js` extensions in all import paths (TypeScript requirement for ES modules).
- Add comments only when the code's purpose is not immediately clear.

## Canonical References

- Environment config: `src/config/env.ts`
- Database: `src/db/index.ts`, `prisma/schema.prisma`
- Middleware patterns: `src/middleware/`
- Repository pattern: `src/repositories/`
- Service pattern: `src/services/`
- Route handlers: `src/routes/`
- Error handling: `src/middleware/errorHandler.ts`
- Shared types: `@regionify/shared`

## TypeScript Rules

- No `any` without explicit justification.
- Explicit types for function parameters and return values.
- Use `type` for object shapes, `interface` for extendable contracts.
- Prefer `type` imports: `import { type MyType } from './types.js'`.
- Always handle `null` and `undefined` cases explicitly.

## API Design

- All responses follow `ApiResponse<T>` or `ApiError` format from shared types.
- Use proper HTTP status codes (see `HttpStatus` constants).
- Use standardized error codes (see `ErrorCode` constants).
- Validate all inputs with Zod schemas from `@regionify/shared/schemas`.
- Route handlers should be thin; delegate to services.

### Response Format

```typescript
// Success
res.json({
  success: true,
  data: { ... },
});

// Error
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Human-readable message',
    details: { field: ['error1', 'error2'] },
  },
});
```

## Error Handling

- Use `AppError` class for expected errors.
- Never expose internal error details in production.
- All async route handlers must catch and forward errors via `next(error)`.
- Log all errors with proper context using pino logger.

```typescript
// Correct pattern
router.post('/endpoint', async (req, res, next) => {
  try {
    const result = await service.doSomething(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
```

## Database (Prisma ORM)

- Schema defined in `prisma/schema.prisma`.
- Use repository pattern for database operations.
- Import Prisma client from `src/db/index.ts`.
- Use Prisma's type-safe queries.
- Handle database errors gracefully.

### Prisma Best Practices

```typescript
// Use the singleton prisma client
import { prisma } from '../db/index.js';

// Queries are type-safe
const user = await prisma.user.findUnique({
  where: { id },
});

// Use select to limit returned fields
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});

// Use transactions for multiple operations
await prisma.$transaction([
  prisma.user.update({ ... }),
  prisma.session.deleteMany({ ... }),
]);
```

### Naming Conventions

- Models: PascalCase singular (e.g., `User`, `Session`)
- Fields: camelCase (e.g., `createdAt`, `emailVerified`)
- Database tables: snake_case via `@@map()` (e.g., `users`)
- Database columns: snake_case via `@map()` (e.g., `created_at`)

## Authentication

- Session-based auth with Redis store.
- Use `requireAuth` middleware for protected routes.
- Regenerate session on login (prevent session fixation).
- Use secure cookie settings in production.
- Rate limit auth endpoints separately.

## Security Best Practices

- **Never** log sensitive data (passwords, tokens, full sessions).
- **Always** validate and sanitize user input.
- **Always** use parameterized queries.
- **Never** expose stack traces in production.
- Use Argon2id for password hashing.
- Apply rate limiting to all routes.
- Set security headers via Helmet.

## Logging (Pino)

```typescript
import { logger } from '@/lib/logger.js';

// Correct
logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ err, userId }, 'Failed to process request');

// Incorrect - don't log sensitive data
logger.info({ password }, 'User data'); // NEVER
```

## Repository Pattern

Repositories handle data access only, no business logic:

```typescript
export const userRepository = {
  async findById(id: string): Promise<UserRow | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? null;
  },
  // ...
};
```

## Service Pattern

Services contain business logic and coordinate repositories:

```typescript
export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Validation, business rules
    const exists = await userRepository.existsByEmail(input.email);
    if (exists) {
      throw new AppError(HttpStatus.CONFLICT, ErrorCode.EMAIL_ALREADY_EXISTS, '...');
    }
    // ...
  },
};
```

## Middleware Order (in app.ts)

1. `trust proxy` setting
2. Security headers (Helmet)
3. CORS
4. Rate limiting
5. Body parsing
6. Cookie parser
7. Request logging
8. Session middleware
9. Passport initialization
10. Routes
11. 404 handler
12. Error handler

## Environment Variables

- All env vars must be validated in `src/config/env.ts`.
- Use Zod for validation with sensible defaults.
- Never commit `.env` files.
- Document all variables in `.env.example`.

## Testing (Future)

- Unit tests for services and utilities.
- Integration tests for routes.
- Use separate test database.
- Mock external services.

## Git Commits

Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.

Examples:

- `feat(auth): add password reset functionality`
- `fix(session): handle Redis connection errors`
- `refactor(db): extract user queries to repository`

## Forbidden

- Using `any` without justification
- String concatenation in SQL queries
- Logging passwords, tokens, or session data
- Exposing internal errors to clients
- Mixing data access and business logic in routes
- Hardcoding configuration values
- Importing without `.js` extension
- Using CommonJS syntax (`require`/`module.exports`)
- Blocking the event loop with synchronous operations
