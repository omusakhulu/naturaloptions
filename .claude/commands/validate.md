# /validate - Run All Validation Checks

Run comprehensive validation including linting, type checking, tests, and build verification.

## Instructions

Execute all validation steps in sequence. Stop and report if any step fails.

1. **Lint Check**
```bash
pnpm lint
```

2. **Type Check**
```bash
pnpm check-types
```

3. **Unit/Component/API Tests**
```bash
pnpm test
```

4. **Build Verification**
```bash
pnpm build
```

5. **E2E Tests** (optional, with `--e2e` flag)
```bash
pnpm e2e
```

## Report Format

```
Validation Report
=================

[✓] Lint Check ........................ PASSED
[✓] Type Check ........................ PASSED
[✓] Unit Tests (45 tests) ............. PASSED
[✓] Component Tests (23 tests) ........ PASSED
[✓] API Tests (67 tests) .............. PASSED
[✓] Build ............................. PASSED
[○] E2E Tests ......................... SKIPPED (use --e2e)

Status: ALL CHECKS PASSED
```

Or if failures occur:

```
Validation Report
=================

[✓] Lint Check ........................ PASSED
[✗] Type Check ........................ FAILED (3 errors)

Errors:
  src/components/ProductCard.tsx:45:10
    TS2322: Type 'string' is not assignable to type 'number'.

  src/lib/db/orders.ts:123:5
    TS2339: Property 'customerId' does not exist on type 'Order'.

  src/app/api/products/route.ts:78:3
    TS7006: Parameter 'request' implicitly has an 'any' type.

Status: VALIDATION FAILED - Fix type errors before proceeding
```

## Options

- `--e2e` - Include E2E tests (slower)
- `--fix` - Auto-fix lint/format issues before checking
- `--fast` - Skip build verification (lint + types + tests only)
- `--verbose` - Show detailed output for all steps

## Usage

```bash
/validate              # Standard validation
/validate --e2e        # Include E2E tests
/validate --fix        # Fix issues then validate
/validate --fast       # Quick validation (no build)
```

## Pre-commit Integration

This command is ideal for:
- Running before committing code
- CI/CD pipeline validation
- Pre-merge verification

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Lint errors |
| 2 | Type errors |
| 3 | Test failures |
| 4 | Build failure |
| 5 | E2E test failures |

## Troubleshooting

### Lint Errors
```bash
pnpm lint:fix  # Auto-fix most issues
```

### Type Errors
- Check import paths
- Verify interface definitions
- Add missing type annotations

### Test Failures
- Run specific test: `pnpm test -- --grep "test name"`
- Check test output for assertion details
- Verify mocks are properly set up

### Build Failures
- Check for import errors
- Verify environment variables
- Review build output for specific errors
