#!/bin/bash

echo "🧹 Clearing Next.js generated types..."

# Remove .next directory
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Removed .next directory"
fi

# Remove node_modules/.cache
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Removed node_modules/.cache"
fi

echo ""
echo "✅ Type cache cleared!"
echo "Run 'pnpm check-types' to regenerate and verify"
