#!/bin/bash

echo "🔍 Verifying build configuration..."
echo ""

# Check TypeScript
echo "1️⃣ Checking TypeScript..."
if pnpm check-types; then
    echo "✅ TypeScript: PASSED"
else
    echo "❌ TypeScript: FAILED"
    exit 1
fi

echo ""

# Check if generateStaticParams exists
echo "2️⃣ Checking generateStaticParams..."
if grep -q "generateStaticParams" src/app/[lang]/layout.jsx; then
    echo "✅ generateStaticParams: EXISTS"
else
    echo "❌ generateStaticParams: MISSING"
    exit 1
fi

echo ""

# Check if notification routes are disabled
echo "3️⃣ Checking notification routes..."
if [ -d "src/app/api/notifications.disabled" ]; then
    echo "✅ Notification routes: DISABLED (correct)"
else
    echo "⚠️  Notification routes: ENABLED (may cause errors)"
fi

echo ""

# Check tsconfig excludes
echo "4️⃣ Checking tsconfig.json..."
if grep -q "\\*\\*\\/\\*.disabled\\/\\*\\*" tsconfig.json; then
    echo "✅ tsconfig.json: .disabled exclusions present"
else
    echo "❌ tsconfig.json: Missing .disabled exclusions"
    exit 1
fi

echo ""

# Check auth.ts uses shared Prisma
echo "5️⃣ Checking Prisma configuration..."
if grep -q "from '@/lib/prisma'" src/config/auth.ts; then
    echo "✅ Auth config: Using shared Prisma instance"
else
    echo "❌ Auth config: Not using shared Prisma"
    exit 1
fi

echo ""

# Check for duplicate login pages
echo "6️⃣ Checking for duplicate login pages..."
if [ -d "src/app/[lang]/login" ]; then
    echo "❌ Duplicate login page exists at src/app/[lang]/login"
    echo "   Run: ./remove-duplicate-login.sh"
    exit 1
else
    echo "✅ No duplicate login pages"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All checks passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You can now build and deploy:"
echo "  npm run build"
echo "  npm start"
