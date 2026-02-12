# Natural Options Admin - Claude Code Configuration

## Project Overview

Natural Options Admin Dashboard is a comprehensive POS and accounting system built with:
- **Frontend**: Next.js 15.1 (App Router) + MUI 7 + Redux Toolkit
- **Backend**: Next.js API Routes + Prisma ORM + PostgreSQL
- **Testing**: Vitest (unit/integration) + Playwright (E2E)

## Key Commands

```bash
# Development
pnpm dev                  # Start dev server
pnpm build               # Production build
pnpm start               # Start production server

# Testing
pnpm test                # Run unit/integration tests
pnpm test:watch          # Run tests in watch mode
pnpm test:coverage       # Run tests with coverage
pnpm test:ui             # Vitest UI
pnpm e2e                 # Run Playwright E2E tests
pnpm e2e:ui              # Playwright UI mode

# Code Quality
pnpm lint                # Run ESLint
pnpm lint:fix            # Fix ESLint errors
pnpm format              # Format with Prettier
pnpm check-types         # TypeScript type check
pnpm validate            # Run all checks (lint + types + test)

# Database
pnpm migrate             # Run Prisma migrations
pnpm seed                # Seed database
pnpm prisma studio       # Open Prisma Studio
```

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # 173 API routes
│   └── [lang]/          # Internationalized pages
├── components/          # React components (42+)
├── lib/                 # Business logic & services
│   ├── db/             # Database access layer
│   ├── services/       # Business services
│   └── woocommerce/    # WooCommerce integration
├── prisma/             # Database schema (1,895 lines)
├── @core/              # Core UI components
├── __tests__/          # Test files
│   ├── unit/           # Unit tests
│   ├── components/     # Component tests
│   └── api/            # API route tests
└── types/              # TypeScript definitions
```

## Testing Guidelines

### Unit Tests (`src/__tests__/unit/`)
- Test utility functions, helpers, and pure business logic
- Mock external dependencies
- Keep tests fast and deterministic

### Component Tests (`src/__tests__/components/`)
- Test React components with React Testing Library
- Focus on user interactions and behavior
- Use `src/__tests__/utils/test-utils.tsx` for providers

### API Tests (`src/__tests__/api/`)
- Test API route handlers
- Verify request validation and error handling
- Use `src/__tests__/utils/api-test-utils.ts` for helpers

### E2E Tests (`e2e/`)
- Test complete user flows
- Run against a real browser with Playwright

## Code Conventions

- Use TypeScript for all new files (`.ts`, `.tsx`)
- Follow existing patterns in the codebase
- Add proper error handling with try/catch
- Validate API inputs with Zod schemas
- Use Prisma for all database operations (parameterized queries)
- Follow OWASP security guidelines

## Important Files

- `src/prisma/schema.prisma` - Database schema
- `src/lib/db/prisma.ts` - Prisma client singleton
- `src/middleware.ts` - Authentication middleware
- `vitest.config.ts` - Test configuration
- `playwright.config.ts` - E2E test configuration
