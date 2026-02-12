# /fix - Auto-fix Code Issues

Automatically fix common code issues including linting, formatting, and type errors.

## Instructions

Run automated fixes in sequence:

1. **Format Code with Prettier**
```bash
pnpm format
```

2. **Fix ESLint Issues**
```bash
pnpm lint:fix
```

3. **Fix Import Ordering**

   ESLint will handle this, but verify imports follow:
   1. Node.js built-ins
   2. External packages
   3. Internal modules (@/)
   4. Type imports

4. **Report Unfixable Issues**

   After auto-fixes, run checks and report anything that requires manual intervention:
```bash
pnpm check-types
pnpm lint
```

5. **Summary**

   Report:
   - Files modified
   - Issues fixed
   - Remaining issues requiring manual fix

## Arguments

```
/fix [--files=<glob>] [--dry-run]

Examples:
/fix                           # Fix all files
/fix --files=src/components/** # Fix specific files
/fix --dry-run                 # Preview changes
```

## Options

- `--files=<glob>` - Only fix matching files
- `--dry-run` - Show what would be changed without applying
- `--lint-only` - Only run ESLint fixes
- `--format-only` - Only run Prettier fixes

## Common Auto-fixable Issues

### ESLint
- Missing semicolons (if configured)
- Incorrect quotes (single/double)
- Import ordering
- Unused imports (some)
- Padding between statements
- Trailing commas

### Prettier
- Indentation
- Line length
- Bracket spacing
- Quote style
- Trailing commas
- Object property alignment

## Issues Requiring Manual Fix

### TypeScript Errors
- Type mismatches
- Missing type annotations
- Incorrect generics
- Null/undefined handling

### ESLint (Non-auto-fixable)
- Unused variables (rename to _var or remove)
- React hooks dependencies
- Accessibility issues
- Security issues

### Logic Errors
- Incorrect conditionals
- Missing error handling
- Race conditions

## Example Output

```
Auto-fix Results
================

Files Modified: 12
Issues Fixed: 47

Fixed Issues:
  - Import ordering (23 files)
  - Quote style (15 instances)
  - Trailing commas (9 instances)

Remaining Issues (Manual Fix Required):

  src/components/ProductCard.tsx:45
    error TS2322: Type 'string' is not assignable to type 'number'

  src/lib/db/orders.ts:89
    warning @typescript-eslint/no-explicit-any: Unexpected 'any'

Run `/typecheck` for full type error details.
```

## Best Practices

1. Run `/fix` before committing
2. Review changes after auto-fix
3. Don't blindly accept all fixes
4. Some "fixes" might change behavior
5. Test after fixing
