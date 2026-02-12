# /review - Code Review Analysis

Perform an automated code review on changed files or specified code.

## Instructions

1. **Identify Changed Files**
```bash
git diff --name-only HEAD~1  # Last commit
# or
git diff --name-only main    # Against main branch
```

2. **Analyze Each Changed File**

   For each file, check:

   a. **Code Quality**
   - Consistent naming conventions
   - Proper error handling
   - No magic numbers/strings
   - DRY principle adherence
   - Single responsibility

   b. **TypeScript Best Practices**
   - No `any` types
   - Proper null/undefined handling
   - Correct use of generics
   - Interface definitions

   c. **Security**
   - Input validation present
   - No exposed secrets
   - Proper authentication checks
   - SQL injection prevention

   d. **Performance**
   - Unnecessary re-renders
   - Missing memoization
   - N+1 query potential
   - Large bundle imports

   e. **Testing**
   - Tests added for new code
   - Edge cases covered
   - Proper mocking

3. **Generate Review Report**

## Arguments

```
/review [--files=<glob>] [--severity=all|error|warning]

Examples:
/review                           # Review uncommitted changes
/review --files=src/components/** # Review specific files
/review --severity=error          # Only show errors
```

## Report Format

```
Code Review Report
==================
Files Analyzed: 5
Issues Found: 12 (3 errors, 7 warnings, 2 suggestions)

FILE: src/components/ProductCard.tsx
-------------------------------------
[ERROR] Line 45: Using 'any' type - specify proper type
[WARN]  Line 23: Missing error boundary for async operation
[SUGGESTION] Line 67: Consider memoizing this callback

FILE: src/app/api/products/route.ts
------------------------------------
[ERROR] Line 12: Missing input validation for request body
[ERROR] Line 34: Potential SQL injection - use parameterized query
[WARN]  Line 56: No rate limiting on this endpoint

FILE: src/lib/db/orders.ts
---------------------------
[WARN]  Line 89: N+1 query detected - consider using include
[SUGGESTION] Line 102: Add index for frequently queried field

SUMMARY
-------
Critical Issues: 3 (must fix before merge)
Warnings: 5 (should fix)
Suggestions: 4 (nice to have)

Overall: NEEDS CHANGES
```

## Review Checklist

### Components
- [ ] Props are properly typed
- [ ] Default props are sensible
- [ ] Event handlers are memoized if passed to children
- [ ] Loading/error states handled
- [ ] Accessibility attributes present

### API Routes
- [ ] Request body validated with Zod
- [ ] Authentication checked where needed
- [ ] Proper HTTP status codes returned
- [ ] Errors don't expose sensitive info
- [ ] Rate limiting considered

### Database Operations
- [ ] Transactions used for multi-step operations
- [ ] Proper error handling
- [ ] Indexes exist for query patterns
- [ ] No raw SQL with user input

### Tests
- [ ] Unit tests for utility functions
- [ ] Component tests for UI behavior
- [ ] API tests for endpoint logic
- [ ] Edge cases covered

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| ERROR | Must fix before merge | Block PR |
| WARNING | Should fix | Request changes |
| SUGGESTION | Nice to have | Comment only |
| INFO | FYI | No action needed |

## Common Issues

### Anti-patterns to Flag
- God components (>300 lines)
- Prop drilling (>3 levels)
- Direct DOM manipulation
- Console.log left in code
- Commented out code
- TODO without ticket reference
- Hardcoded URLs/config

### Security Red Flags
- `dangerouslySetInnerHTML`
- `eval()` or `new Function()`
- Disabled ESLint rules
- Credentials in code
- Missing CSRF protection
