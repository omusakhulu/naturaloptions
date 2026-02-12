# /audit:bundle - Bundle Size Analysis

Analyze the production bundle size and identify optimization opportunities.

## Instructions

1. **Build with Bundle Analysis**
```bash
ANALYZE=true pnpm build
```
   Or install and use bundle analyzer:
```bash
npx @next/bundle-analyzer
```

2. **Check Build Output**

   Review `.next/analyze/` directory for bundle reports if available.

3. **Identify Large Dependencies**

   Look for:
   - Packages > 100KB
   - Duplicated code across chunks
   - Unused exports that aren't tree-shaken

4. **Page-by-Page Analysis**

   Check each page's JavaScript bundle size in build output.

## Report Format

```
Bundle Analysis Report
======================

TOTAL BUNDLE SIZE
-----------------
First Load JS: [size]
Shared chunks: [size]

LARGEST DEPENDENCIES
--------------------
Package                Size      % of Bundle
-------                ----      -----------
@mui/material          150KB     15%
apexcharts             120KB     12%
@fullcalendar/core     100KB     10%

PAGE SIZES
----------
Page                          First Load
----                          ----------
/                             250KB
/[lang]/dashboard             280KB
/[lang]/products              300KB
/[lang]/pos                   350KB

OPTIMIZATION OPPORTUNITIES
--------------------------
1. [Specific recommendations]
2. [Code splitting suggestions]
3. [Lazy loading candidates]
```

## Optimization Techniques

### Dynamic Imports
```typescript
// Before
import HeavyChart from '@/components/HeavyChart'

// After
import dynamic from 'next/dynamic'
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // If client-only
})
```

### Lazy Load Libraries
```typescript
// Before
import { format } from 'date-fns'

// After - only import what you need
import format from 'date-fns/format'
```

### Code Splitting by Route
```typescript
// pages/heavy-page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
```

### Reduce MUI Bundle
```typescript
// Import specific components
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'

// Instead of
import { Button, Card } from '@mui/material'
```

### Tree Shaking
```typescript
// Use named exports for better tree shaking
export { specificFunction }

// Avoid default exports with large objects
export default { fn1, fn2, fn3 } // Bad - entire object included
```

## Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Load JS (shared) | < 100KB | ? |
| Page JS (average) | < 200KB | ? |
| Largest Chunk | < 250KB | ? |
| Total Bundle | < 1MB | ? |

## Tools

### Bundle Analyzer
```bash
# Install
pnpm add -D @next/bundle-analyzer

# Configure in next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
```

### Source Map Explorer
```bash
npx source-map-explorer .next/static/chunks/*.js
```

### Import Cost (VS Code Extension)
Shows import size inline in editor.

## Monitoring

Set up bundle size monitoring in CI:

```yaml
# In GitHub Actions
- name: Check bundle size
  run: |
    pnpm build
    # Compare against baseline
    npx bundlesize
```
