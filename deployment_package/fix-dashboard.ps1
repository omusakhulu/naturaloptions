# Fix dashboard ERR_INCOMPLETE_CHUNKED_ENCODING errors
Write-Host "🛑 Stopping development server..." -ForegroundColor Yellow

# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "🧹 Cleaning build cache..." -ForegroundColor Yellow

# Remove build artifacts
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Removed .next folder" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Removed node_modules\.cache" -ForegroundColor Green
}

Write-Host "`n🔄 Starting fresh dev server..." -ForegroundColor Yellow
npm run dev
