# Remove duplicate login page
Write-Host "🗑️ Removing duplicate login page..." -ForegroundColor Yellow

$duplicateLogin = "src\app\[lang]\login"

if (Test-Path $duplicateLogin) {
    Remove-Item -Path $duplicateLogin -Recurse -Force
    Write-Host "✅ Removed $duplicateLogin" -ForegroundColor Green
    Write-Host ""
    Write-Host "The correct login page is at:" -ForegroundColor Cyan
    Write-Host "  src\app\[lang]\(blank-layout-pages)\(guest-only)\login\page.jsx" -ForegroundColor White
} else {
    Write-Host "✓ Duplicate login page already removed" -ForegroundColor Green
}
