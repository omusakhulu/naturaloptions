# PowerShell script to find TypeScript type issues in the project

Write-Host "🔍 Scanning for TypeScript type issues in src folder..." -ForegroundColor Cyan
Write-Host ""

# Find all files with 'any' types
Write-Host "📊 Files with 'any' types:" -ForegroundColor Yellow

# Get all TypeScript files and search for 'any' types
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Select-String -Pattern ":\s*any\b|:\s*any\[\]|\bany\[\]|\(.*:\s*any\)" | 
    Group-Object -Property Path | 
    Sort-Object -Property Count -Descending

Write-Host "Found $($files.Count) files with 'any' types" -ForegroundColor Green
Write-Host ""

# Show top 20 files with most 'any' types
Write-Host "Top 20 files with most 'any' types:" -ForegroundColor Yellow
$files | Select-Object -First 20 | ForEach-Object {
    $relativePath = $_.Name.Replace((Get-Location).Path + "\", "")
    Write-Host "  $($_.Count.ToString().PadLeft(3)) matches: $relativePath" -ForegroundColor White
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Check for other common type issues
Write-Host "🔍 Checking for other type issues:" -ForegroundColor Cyan

# Check for @ts-ignore
$tsIgnoreCount = (Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Select-String -Pattern "@ts-ignore").Count
Write-Host "  @ts-ignore comments: $tsIgnoreCount" -ForegroundColor $(if ($tsIgnoreCount -gt 0) { "Yellow" } else { "Green" })

# Check for @ts-expect-error
$tsExpectErrorCount = (Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Select-String -Pattern "@ts-expect-error").Count
Write-Host "  @ts-expect-error comments: $tsExpectErrorCount" -ForegroundColor $(if ($tsExpectErrorCount -gt 0) { "Yellow" } else { "Green" })

# Check for Function type (should use specific function signatures)
$functionTypeCount = (Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Select-String -Pattern ":\s*Function\b").Count
Write-Host "  Function type usage: $functionTypeCount" -ForegroundColor $(if ($functionTypeCount -gt 0) { "Yellow" } else { "Green" })

# Check for Object type (should use specific object types)
$objectTypeCount = (Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | 
    Select-String -Pattern ":\s*Object\b").Count
Write-Host "  Object type usage: $objectTypeCount" -ForegroundColor $(if ($objectTypeCount -gt 0) { "Yellow" } else { "Green" })

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Summary
$totalAnyCount = ($files | Measure-Object -Property Count -Sum).Sum
Write-Host "📈 Summary:" -ForegroundColor Cyan
Write-Host "  Total 'any' type occurrences: $totalAnyCount" -ForegroundColor Red
Write-Host "  Files with 'any' types: $($files.Count)" -ForegroundColor Yellow
Write-Host ""

# Recommendations
Write-Host "💡 Recommendations:" -ForegroundColor Cyan
Write-Host "  1. Replace 'any' with specific types or 'unknown' when type is truly unknown" -ForegroundColor White
Write-Host "  2. Use interfaces/types for object shapes" -ForegroundColor White
Write-Host "  3. Use generics for reusable type-safe code" -ForegroundColor White
Write-Host "  4. Run 'npx tsc --noEmit' to check for type errors" -ForegroundColor White
Write-Host ""

Write-Host "✅ Scan complete!" -ForegroundColor Green
