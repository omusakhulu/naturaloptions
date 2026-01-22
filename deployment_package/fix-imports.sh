#!/bin/bash

echo "🔧 Fixing import and export errors..."

# Remove any duplicate route.ts file if route.js exists
if [ -f "src/app/api/auth/[...nextauth]/route.js" ] && [ -f "src/app/api/auth/[...nextauth]/route.ts" ]; then
    echo "📝 Removing duplicate route.ts file..."
    rm -f "src/app/api/auth/[...nextauth]/route.ts"
fi

# Fix products.ts return statement indentation issues
echo "📝 Fixing products.ts indentation..."
sed -i 's/^return /    return /g' src/lib/db/products.ts

echo "✅ Import fixes applied!"
echo ""
echo "Now run the build command:"
echo "NODE_OPTIONS='--max-old-space-size=6144' pnpm build:prod"
