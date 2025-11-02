# Quick Setup Verification for GAS Auto-Deploy
Write-Host "🔍 Verifying GAS Auto-Deploy Setup..." -ForegroundColor Cyan
Write-Host ""

# Check 1: Service Account JSON exists
Write-Host "📋 Checking service account JSON..." -ForegroundColor Yellow
$jsonPath = "secrets\ysp-web-app-migration.json"
if (Test-Path $jsonPath) {
    $json = Get-Content $jsonPath | ConvertFrom-Json
    Write-Host "   ✅ Service account JSON found" -ForegroundColor Green
    Write-Host "   📧 Email: $($json.client_email)" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Service account JSON not found at: $jsonPath" -ForegroundColor Red
    exit 1
}

# Check 2: .env.local exists
Write-Host ""
Write-Host "📋 Checking .env.local configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "GOOGLE_SERVICE_ACCOUNT_JSON_PATH") {
        Write-Host "   ✅ GOOGLE_SERVICE_ACCOUNT_JSON_PATH is set" -ForegroundColor Green
    } else {
        Write-Host "   ❌ GOOGLE_SERVICE_ACCOUNT_JSON_PATH not found in .env.local" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ❌ .env.local not found" -ForegroundColor Red
    exit 1
}

# Check 3: YSP_LoginAccess.gs exists
Write-Host ""
Write-Host "📋 Checking GAS source file..." -ForegroundColor Yellow
if (Test-Path "YSP_LoginAccess.gs") {
    $fileSize = (Get-Item "YSP_LoginAccess.gs").Length
    $fileSizeKB = [math]::Round($fileSize / 1024, 2)
    Write-Host "   ✅ YSP_LoginAccess.gs found" -ForegroundColor Green
    Write-Host "   📦 Size: $fileSizeKB KB" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ YSP_LoginAccess.gs not found" -ForegroundColor Red
    exit 1
}

# Check 4: Node modules installed
Write-Host ""
Write-Host "📋 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules\googleapis") {
    Write-Host "   ✅ googleapis installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  googleapis not found - run: npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📝 MANUAL SETUP STEPS REQUIRED:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Enable Apps Script API:" -ForegroundColor White
Write-Host "   • Go to: https://console.cloud.google.com/apis/library/script.googleapis.com" -ForegroundColor Gray
Write-Host "   • Select project: ysp-web-app-migration" -ForegroundColor Gray
Write-Host "   • Click 'ENABLE'" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Share GAS Project with Service Account:" -ForegroundColor White
Write-Host "   • Go to: https://script.google.com/home/projects/1CEx53zlJZHarkYESoUzbuV3Jj04rA6YKVSpsh1n-sClm_PHjXJyeuSXf/edit" -ForegroundColor Gray
Write-Host "   • Click 'Share' (top right)" -ForegroundColor Gray
Write-Host "   • Add email: $($json.client_email)" -ForegroundColor Cyan
Write-Host "   • Give 'Editor' access" -ForegroundColor Gray
Write-Host "   • Click 'Send'" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  After completing steps 1 & 2, run:" -ForegroundColor White
Write-Host "   npm run gas:auto-deploy" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Setup verification complete!" -ForegroundColor Green
