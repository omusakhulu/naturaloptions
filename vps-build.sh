#!/bin/bash

echo "🚀 Starting optimized build for VPS..."

# Clean previous build artifacts
echo "🧹 Cleaning build cache..."
rm -rf .next node_modules/.cache /tmp/next-* ~/.npm/_cacache

# Set environment variables for optimized build
export NODE_OPTIONS="--max-old-space-size=6144"
export SKIP_ENV_VALIDATION=true
export NODE_ENV=production

# Disable type checking during build to save memory
export SKIP_TYPE_CHECK=true

echo "📦 Building application..."

# Run build with pnpm 
pnpm build:prod || npm run build:prod

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed. Trying with reduced memory..."
    
    # Try with lower memory if first attempt fails
    export NODE_OPTIONS="--max-old-space-size=4096"
    pnpm build || npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build completed with reduced memory!"
    else
        echo "❌ Build failed. Please check your code for errors."
        exit 1
    fi
fi

echo "🎉 Build process complete!"
