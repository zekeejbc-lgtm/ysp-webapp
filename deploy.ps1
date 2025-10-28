# Quick Deploy Script for Windows PowerShell
# Usage: .\deploy.ps1 "your commit message"

param(
    [Parameter(Mandatory=$false)]
    [string]$message = "update: frontend changes"
)

Write-Host "🚀 YSP WebApp - Quick Deploy to Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "📦 Staging all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "$message"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ SUCCESS! Changes pushed to GitHub" -ForegroundColor Green
        Write-Host "🌐 Vercel will automatically deploy in ~2-4 minutes" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Check deployment status:" -ForegroundColor Cyan
        Write-Host "   https://vercel.com/dashboard" -ForegroundColor White
        Write-Host ""
        Write-Host "🔗 Production URL:" -ForegroundColor Cyan
        Write-Host "   https://ysp-webapp.vercel.app" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Push failed! Check your internet connection or permissions." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Blue
}

Write-Host ""
