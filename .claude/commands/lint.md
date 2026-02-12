# /lint - Run Code Linting and Formatting

Run all code quality checks including ESLint, Prettier, and TypeScript type checking.

## Instructions

1. Run ESLint to check for code quality issues:
```bash
pnpm lint
```

2. Run TypeScript type checking:
```bash
pnpm check-types
```

3. Check Prettier formatting:
```bash
pnpm prettier --check "src/**/*.{js,jsx,ts,tsx}"
```

4. Report findings in a structured format:
   - ESLint errors and warnings (grouped by file)
   - TypeScript errors (with file paths and line numbers)
   - Formatting issues

5. If the `--fix` flag is provided, automatically fix issues:
```bash
pnpm lint:fix && pnpm format
```

## Options

- `--fix` - Automatically fix fixable issues
- `--eslint` - Run only ESLint
- `--types` - Run only TypeScript checks
- `--format` - Run only Prettier check/fix

## Example Usage

```
/lint              # Check all linting issues
/lint --fix        # Fix all fixable issues
/lint --types      # Check only TypeScript errors
```

## Common Issues

### Import Order
ESLint enforces import ordering: builtin > external > internal > type

### Unused Variables
Prefix with underscore to ignore: `_unusedVar`

### Type Errors
Avoid using `any` - prefer `unknown` or specific types
