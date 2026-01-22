# Git Setup Script for Windows
# This script helps you initialize and push your repository to GitHub/GitLab

Write-Host "🚀 Omnishop Admin Dashboard - Git Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git from https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Check if already initialized
if (Test-Path ".git") {
    Write-Host "⚠️  Git repository already initialized" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Add files
Write-Host ""
Write-Host "📝 Adding files to git..." -ForegroundColor Yellow
git add .

# Commit
Write-Host ""
$commitMessage = Read-Host "Enter commit message [Initial commit - Omnishop Admin Dashboard]"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit - Omnishop Admin Dashboard"
}

git commit -m "$commitMessage"
Write-Host "✅ Files committed" -ForegroundColor Green

# Setup remote
Write-Host ""
Write-Host "🌐 Remote Repository Setup" -ForegroundColor Cyan
Write-Host ""
$remoteUrl = Read-Host "Enter your Git repository URL (e.g., https://github.com/username/repo.git)"

if (-not [string]::IsNullOrWhiteSpace($remoteUrl)) {
    # Check if remote exists
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "⚠️  Updating existing remote" -ForegroundColor Yellow
        git remote set-url origin $remoteUrl
    } else {
        git remote add origin $remoteUrl
    }
    
    Write-Host "✅ Remote added: $remoteUrl" -ForegroundColor Green
    
    # Push to remote
    Write-Host ""
    Write-Host "📤 Pushing to remote..." -ForegroundColor Yellow
    git branch -M main
    git push -u origin main
    
    Write-Host ""
    Write-Host "✅ Successfully pushed to remote!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipped remote setup" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Git setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH into your VPS" -ForegroundColor Yellow
Write-Host "2. Run: wget https://raw.githubusercontent.com/YOUR_USERNAME/omnishop-admin/main/vps-setup.sh" -ForegroundColor Yellow
Write-Host "3. Run: chmod +x vps-setup.sh && ./vps-setup.sh" -ForegroundColor Yellow
Write-Host ""
