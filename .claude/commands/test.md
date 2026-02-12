# /test - Run All Tests

Run the complete test suite including unit tests, component tests, and API tests.

## Instructions

1. First, run the Vitest test suite:
```bash
pnpm test
```

2. If all unit/component/API tests pass, run E2E tests:
```bash
pnpm e2e
```

3. Report the results in a summary table format:
   - Number of test suites
   - Number of tests passed/failed/skipped
   - Any failing test details with file paths and error messages

4. If tests fail:
   - Analyze the failure messages
   - Identify the root cause
   - Suggest fixes if the cause is clear
   - Do NOT automatically fix tests unless explicitly asked

## Options

- `--unit` - Run only unit tests
- `--component` - Run only component tests
- `--api` - Run only API tests
- `--e2e` - Run only E2E tests
- `--watch` - Run in watch mode
- `--coverage` - Include coverage report

## Example Usage

```
/test              # Run all tests
/test --unit       # Run only unit tests
/test --coverage   # Run with coverage
/test --e2e        # Run only E2E tests
```
