#!/bin/bash

# Remove duplicate login page
echo "🗑️ Removing duplicate login page..."

duplicate_login="src/app/[lang]/login"

if [ -d "$duplicate_login" ]; then
    rm -rf "$duplicate_login"
    echo "✅ Removed $duplicate_login"
    echo ""
    echo "The correct login page is at:"
    echo "  src/app/[lang]/(blank-layout-pages)/(guest-only)/login/page.jsx"
else
    echo "✓ Duplicate login page already removed"
fi
