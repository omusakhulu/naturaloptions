# /generate:test - Generate Test File

Generate a test file for a given source file or component.

## Instructions

1. Parse the argument to determine the target file:
   - If a file path is provided, generate tests for that specific file
   - If a component/function name is provided, search for it in the codebase

2. Read the source file and analyze:
   - For components: Identify props, state, event handlers, effects
   - For functions: Identify parameters, return types, edge cases
   - For API routes: Identify HTTP methods, request validation, responses

3. Generate appropriate test file:
   - **Components** → `src/__tests__/components/{ComponentName}.test.tsx`
   - **Utilities** → `src/__tests__/unit/{filename}.test.ts`
   - **API Routes** → `src/__tests__/api/{route-name}.test.ts`

4. Include test cases for:
   - Happy path scenarios
   - Edge cases (empty inputs, null values, etc.)
   - Error handling
   - Boundary conditions

5. Use the appropriate testing utilities:
   - Components: `@testing-library/react`, `test-utils.tsx`
   - API: `api-test-utils.ts`
   - Unit: Standard Vitest mocking

## Arguments

```
/generate:test <file-path>           # Generate tests for specific file
/generate:test <ComponentName>       # Generate tests for a component
/generate:test src/lib/db/products   # Generate tests for module
```

## Example Generated Test Structure

### For a Component
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => { ... })
  it('should handle user interaction', () => { ... })
  it('should display error state', () => { ... })
})
```

### For an API Route
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, assertApiResponse } from '@/__tests__/utils/api-test-utils'

describe('GET /api/products', () => {
  it('should return products list', async () => { ... })
  it('should handle pagination', async () => { ... })
  it('should return 401 for unauthenticated requests', async () => { ... })
})
```

## Guidelines

- Follow AAA pattern: Arrange, Act, Assert
- One assertion per test when possible
- Use descriptive test names: "should [action] when [condition]"
- Mock external dependencies (Prisma, fetch, etc.)
- Don't test implementation details, test behavior
