# /build - Build and Validate Production Bundle

Build the Next.js application for production and validate the output.

## Instructions

1. First, run pre-build checks:
```bash
pnpm check-types
```

2. If type checking passes, run the production build:
```bash
pnpm build:prod
```

3. Analyze the build output:
   - Report any build errors or warnings
   - Show bundle size summary if available
   - List any large chunks that might need optimization

4. If build succeeds, optionally start the production server to verify:
```bash
pnpm start
```
   Then check that the server starts without errors.

## Options

- `--analyze` - Include bundle analysis
- `--no-lint` - Skip pre-build linting
- `--start` - Start production server after build

## Build Errors

### Common Issues

**Out of Memory**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=6144" pnpm build
```

**Module Not Found**
- Check import paths use correct aliases (@/, @core/, etc.)
- Verify the module is installed in package.json

**Type Errors During Build**
- TypeScript errors are not ignored during build
- Fix all type errors before building

## Bundle Optimization Tips

1. Use dynamic imports for large components:
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

2. Check for duplicate dependencies with:
```bash
pnpm why <package-name>
```

3. Ensure unused code is tree-shaken by using named exports
