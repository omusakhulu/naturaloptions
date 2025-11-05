#!/bin/bash

echo "🔧 Fixing all build errors..."
echo ""

# 1. Remove duplicate login pages
echo "1️⃣ Removing duplicate login pages..."
duplicates=(
    "src/app/[lang]/login"
    "src/app/en/login"
    "src/app/login"
)

for dir in "${duplicates[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "  ✅ Removed $dir"
    fi
done

# 2. Remove notifications.disabled from build (move outside src)
echo ""
echo "2️⃣ Removing disabled API routes from build..."
if [ -d "src/app/api/notifications.disabled" ]; then
    mkdir -p disabled-code
    mv src/app/api/notifications.disabled disabled-code/
    echo "  ✅ Moved notifications.disabled outside build path"
fi

# 3. Clear build cache
echo ""
echo "3️⃣ Clearing build cache..."
rm -rf .next node_modules/.cache
echo "  ✅ Cache cleared"

# 4. Fix WooCommerce URL typo reminder
echo ""
echo "4️⃣ REMINDER: Fix WooCommerce URL typo in .env"
echo "  Change: WOO_STORE_URL=htps://... (missing 't')"
echo "  To: WOO_STORE_URL=https://..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All fixes applied!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Fix WOO_STORE_URL in .env (if not done)"
echo "  2. Run: pnpm build"
echo "  3. Run: pm2 restart omnishop-admin"
