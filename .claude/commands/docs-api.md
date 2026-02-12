# /docs:api - Generate API Documentation

Generate OpenAPI/Swagger documentation for the API routes.

## Instructions

1. **Scan API Routes**

   Find all route files in `src/app/api/`:
   - Identify HTTP methods (GET, POST, PUT, DELETE, PATCH)
   - Extract request/response schemas
   - Note authentication requirements

2. **Generate OpenAPI Spec**

   Create `docs/api/openapi.yaml` with:
   - API info and version
   - Server URLs
   - Authentication schemes
   - All endpoints with schemas

3. **Generate Markdown Documentation**

   Create `docs/api/README.md` with:
   - API overview
   - Authentication guide
   - Endpoint reference
   - Example requests/responses

## Arguments

```
/docs:api [--format=openapi|markdown|both] [--output=<path>]

Examples:
/docs:api                           # Generate both formats
/docs:api --format=openapi          # OpenAPI spec only
/docs:api --output=docs/api-spec    # Custom output path
```

## Output Structure

```
docs/api/
├── openapi.yaml        # OpenAPI 3.0 specification
├── README.md           # Human-readable documentation
└── endpoints/          # Per-endpoint documentation
    ├── products.md
    ├── orders.md
    ├── customers.md
    └── ...
```

## OpenAPI Template

```yaml
openapi: 3.0.3
info:
  title: Natural Options Admin API
  version: 4.0.0
  description: POS and Accounting System API

servers:
  - url: http://localhost:3000/api
    description: Development server
  - url: https://production.example.com/api
    description: Production server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Product:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        price:
          type: string
        sku:
          type: string
          nullable: true
        stockQuantity:
          type: integer

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string

paths:
  /products:
    get:
      summary: List products
      tags: [Products]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
            maximum: 100
      responses:
        '200':
          description: Products list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  pagination:
                    type: object
```

## Markdown Template

```markdown
# Natural Options Admin API

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Endpoints

### Products

#### List Products
\`GET /api/products\`

Query Parameters:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max 100) |
| search | string | - | Search by name |

Response:
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
\`\`\`
```

## Discovery Process

For each API route file:

1. Read the file and extract:
   - HTTP method handlers (GET, POST, etc.)
   - Request body parsing
   - Query parameter usage
   - Response shapes
   - Error responses

2. Infer schemas from:
   - Zod validation schemas
   - TypeScript types
   - Prisma model relations

3. Document authentication from:
   - `getServerSession` calls
   - Middleware checks

## Updates

Run `/docs:api` after:
- Adding new API routes
- Changing request/response formats
- Updating authentication requirements
- Modifying validation schemas
