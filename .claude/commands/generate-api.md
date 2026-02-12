# /generate:api - Scaffold New API Route

Generate a new Next.js API route with proper structure, validation, and error handling.

## Instructions

1. Parse the argument to determine the route path:
   - Extract the endpoint name (e.g., `/api/products/[id]`)
   - Determine if it's a dynamic route (contains `[param]`)

2. Create the route file at the appropriate location:
   - Path: `src/app/api/{route-path}/route.ts`

3. Generate route handler with:
   - TypeScript types for request/response
   - Zod schema for request validation
   - Proper error handling with try/catch
   - Authentication check if needed
   - Prisma operations for database access

4. Include all requested HTTP methods (GET, POST, PUT, DELETE, PATCH)

5. Generate corresponding test file at `src/__tests__/api/{route-name}.test.ts`

## Arguments

```
/generate:api <route-path> [--methods=GET,POST] [--auth] [--model=ModelName]

Examples:
/generate:api products                    # Basic CRUD for products
/generate:api products/[id]               # Single product operations
/generate:api products/[id]/reviews       # Nested route
/generate:api auth/login --methods=POST   # POST only endpoint
```

## Options

- `--methods=GET,POST,PUT,DELETE` - Specify HTTP methods (default: GET,POST)
- `--auth` - Require authentication
- `--model=ModelName` - Prisma model to use

## Generated Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/prisma'
import { authOptions } from '@/lib/auth'

// Request validation schema
const CreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // ... other fields
})

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')

    // Fetch data
    const data = await prisma.model.findMany({
      skip: (page - 1) * 10,
      take: 10,
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const body = await request.json()
    const validated = CreateSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues },
        { status: 400 }
      )
    }

    // Create record
    const created = await prisma.model.create({
      data: validated.data,
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Validation Patterns

```typescript
// Numeric ID validation (reject NaN/Infinity)
const idSchema = z.number().int().positive().finite()

// Pagination
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// Search with sanitization
const searchSchema = z.string().max(100).optional()
```
