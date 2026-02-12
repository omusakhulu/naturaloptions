# /typecheck - TypeScript Type Checking

Run TypeScript compiler to check for type errors without emitting files.

## Instructions

1. Run the TypeScript compiler in check mode:
```bash
pnpm check-types
```

2. Parse the output and report:
   - Total number of errors
   - Errors grouped by file
   - Each error with:
     - File path and line number
     - Error code (e.g., TS2345)
     - Error message
     - Suggested fix if applicable

3. For common errors, provide specific guidance:
   - **TS2322** (Type not assignable): Check if types match or need assertion
   - **TS2339** (Property does not exist): Check if property is optional or needs to be added to interface
   - **TS2345** (Argument type mismatch): Verify function signature and argument types
   - **TS7006** (Implicit any): Add explicit type annotation

## Options

- `--strict` - Run with additional strict checks
- `--verbose` - Show all checked files

## Example Output

```
TypeScript Check Results
========================
Total Errors: 3

src/components/ProductCard.tsx:45:10
  TS2322: Type 'string' is not assignable to type 'number'.
  Fix: Convert string to number with parseInt() or parseFloat()

src/lib/db/orders.ts:123:5
  TS2339: Property 'customerId' does not exist on type 'Order'.
  Fix: Add 'customerId' to the Order interface or use optional chaining
```

## Quick Fixes

### Adding Types to Parameters
```typescript
// Before
function process(data) { ... }

// After
function process(data: ProcessData) { ... }
```

### Handling Nullable Types
```typescript
// Before (error: Object is possibly undefined)
const name = user.profile.name

// After
const name = user?.profile?.name ?? 'Unknown'
```
