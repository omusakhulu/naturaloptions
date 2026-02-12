# /audit:security - Security Vulnerability Scan

Perform a comprehensive security audit of the codebase.

## Instructions

1. **Dependency Vulnerabilities**
```bash
pnpm audit
```
   Report any high/critical vulnerabilities with remediation steps.

2. **Code Security Scan**

   Search for common security issues:

   a. **SQL Injection** - Look for raw SQL queries
   ```
   Search for: $queryRaw, $executeRaw, raw SQL strings
   ```

   b. **XSS Vulnerabilities** - Unsanitized HTML rendering
   ```
   Search for: dangerouslySetInnerHTML, innerHTML
   ```

   c. **Exposed Secrets** - Hardcoded credentials
   ```
   Search for: password=, apiKey=, secret=, token= (not in .env files)
   ```

   d. **Insecure Dependencies** - Known vulnerable packages
   ```
   Check: node_modules for outdated packages
   ```

   e. **Missing Input Validation** - API routes without validation
   ```
   Review: src/app/api/**/route.ts for Zod/validation
   ```

   f. **Authentication Bypass** - Missing auth checks
   ```
   Check: API routes that should require authentication
   ```

3. **Report Format**

```
Security Audit Report
=====================
Date: [timestamp]

CRITICAL (Immediate Action Required)
------------------------------------
[List critical issues]

HIGH (Fix Within 24 Hours)
--------------------------
[List high priority issues]

MEDIUM (Fix Within 1 Week)
--------------------------
[List medium priority issues]

LOW (Fix When Possible)
-----------------------
[List low priority issues]

RECOMMENDATIONS
---------------
[General security improvements]
```

## Specific Checks

### API Route Security
- [ ] All sensitive routes require authentication
- [ ] Rate limiting is implemented
- [ ] Input validation with Zod schemas
- [ ] Proper error messages (no stack traces in production)

### Data Protection
- [ ] Passwords hashed with bcrypt
- [ ] Sensitive data encrypted at rest
- [ ] PII not logged
- [ ] Session tokens properly managed

### Infrastructure
- [ ] HTTPS enforced
- [ ] Security headers configured (helmet.js)
- [ ] CORS properly configured
- [ ] CSP headers set

## Common Fixes

### Add Input Validation
```typescript
import { z } from 'zod'

const schema = z.object({
  id: z.number().int().positive().finite(), // Rejects NaN/Infinity
  email: z.string().email(),
  name: z.string().min(1).max(100),
})
```

### Add Rate Limiting
```typescript
// In middleware.ts or API route
const rateLimit = new Map()

function checkRateLimit(ip: string, limit = 100, window = 60000) {
  const now = Date.now()
  const record = rateLimit.get(ip) || { count: 0, start: now }

  if (now - record.start > window) {
    record.count = 0
    record.start = now
  }

  record.count++
  rateLimit.set(ip, record)

  return record.count <= limit
}
```

### Add Security Headers
```typescript
// In next.config.mjs
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```
