# /generate:component - Create React Component

Generate a new React component with TypeScript types, tests, and proper structure.

## Instructions

1. Parse the argument to determine the component name and location:
   - Use PascalCase for component names
   - Determine appropriate directory based on component type

2. Create the component file:
   - Path: `src/components/{category}/{ComponentName}.tsx`
   - Include TypeScript interface for props
   - Use functional component with proper typing
   - Add JSDoc documentation

3. Generate corresponding test file:
   - Path: `src/__tests__/components/{ComponentName}.test.tsx`
   - Include basic render test and interaction tests

## Arguments

```
/generate:component <ComponentName> [--category=<category>] [--props]

Examples:
/generate:component ProductCard --category=products
/generate:component SearchInput --category=common --props="placeholder:string,onSearch:function"
/generate:component DashboardWidget --category=dashboard
```

## Options

- `--category=<name>` - Subdirectory in components folder
- `--props=<prop-list>` - Comma-separated props with types
- `--mui` - Include MUI imports and styling
- `--form` - Create a form component with react-hook-form

## Generated Structure

### Basic Component
```typescript
'use client'

import React from 'react'

interface ProductCardProps {
  /** Product name to display */
  name: string
  /** Product price */
  price: number
  /** Optional image URL */
  imageUrl?: string
  /** Callback when card is clicked */
  onClick?: () => void
}

/**
 * ProductCard displays a product with name, price, and optional image.
 */
export function ProductCard({
  name,
  price,
  imageUrl,
  onClick,
}: ProductCardProps) {
  return (
    <div
      className="product-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {imageUrl && (
        <img src={imageUrl} alt={name} className="product-image" />
      )}
      <h3 className="product-name">{name}</h3>
      <p className="product-price">${price.toFixed(2)}</p>
    </div>
  )
}
```

### With MUI
```typescript
'use client'

import React from 'react'
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material'

interface ProductCardProps {
  name: string
  price: number
  imageUrl?: string
  onClick?: () => void
}

export function ProductCard({ name, price, imageUrl, onClick }: ProductCardProps) {
  return (
    <Card
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {imageUrl && (
        <CardMedia
          component="img"
          height="140"
          image={imageUrl}
          alt={name}
        />
      )}
      <CardContent>
        <Typography variant="h6">{name}</Typography>
        <Typography color="text.secondary">
          ${price.toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  )
}
```

### Generated Test
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { ProductCard } from '@/components/products/ProductCard'

describe('ProductCard', () => {
  const defaultProps = {
    name: 'Test Product',
    price: 29.99,
  }

  it('should render product name and price', () => {
    render(<ProductCard {...defaultProps} />)

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  it('should render image when imageUrl is provided', () => {
    render(<ProductCard {...defaultProps} imageUrl="/test.jpg" />)

    expect(screen.getByRole('img')).toHaveAttribute('src', '/test.jpg')
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<ProductCard {...defaultProps} onClick={handleClick} />)

    fireEvent.click(screen.getByText('Test Product'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Component Guidelines

1. **Naming**: Use PascalCase, descriptive names
2. **Props**: Define interface with JSDoc comments
3. **Types**: Avoid `any`, use specific types
4. **Accessibility**: Include ARIA attributes where needed
5. **Testing**: Cover render, interaction, and edge cases
