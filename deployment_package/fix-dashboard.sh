#!/bin/bash

echo "🛑 Stopping development server..."

# Kill all node processes
pkill -9 node 2>/dev/null || true
sleep 2

echo "🧹 Cleaning build cache..."

# Remove build artifacts
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Removed .next folder"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Removed node_modules/.cache"
fi

echo ""
echo "🔄 Starting fresh dev server..."
npm run dev
