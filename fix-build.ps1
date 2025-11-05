# Fix webpack chunk loading errors
Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Yellow

# Remove build directories
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Removed .next folder" -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Removed node_modules/.cache" -ForegroundColor Green
}

# Clear Next.js cache
Write-Host "`n🔄 Rebuilding application..." -ForegroundColor Yellow
npm run build

Write-Host "`n✨ Build complete! Run 'npm run dev' to start the server." -ForegroundColor Green
