#!/bin/bash

echo "🔍 Checking TypeScript types in EventTentQuoteForm.tsx..."
echo ""

# Check for TypeScript errors in the specific file
npx tsc --noEmit --skipLibCheck src/app/\[lang\]/\(dashboard\)/\(private\)/apps/quotes/event-tent/EventTentQuoteForm.tsx

if [ $? -eq 0 ]; then
    echo "✅ No TypeScript errors found in EventTentQuoteForm.tsx"
else
    echo "❌ TypeScript errors found. Please review the output above."
fi

echo ""
echo "🔍 Checking all TypeScript files..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ No TypeScript errors found in the project"
else
    echo "⚠️  Some TypeScript errors found in the project"
fi
