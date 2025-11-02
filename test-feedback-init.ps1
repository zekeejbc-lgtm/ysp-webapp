# Test script for initFeedbackSheet action
$url = "https://script.google.com/macros/s/AKfycbyepq64QJEfXRzACKaXGSevEXdb-TueUaxtnTEQCnnFsECZGq1AWqNqyKZ9GeMmvcao2g/exec"

$body = @{
    action = "initFeedbackSheet"
} | ConvertTo-Json

Write-Host "Testing initFeedbackSheet action..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"

Write-Host "`nResponse:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10

if ($response.success) {
    Write-Host "`n✅ SUCCESS! Feedback sheet schema initialized." -ForegroundColor Green
    Write-Host "Check your Google Sheets Feedback tab - it should now have all 16 columns!" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ FAILED: $($response.message)" -ForegroundColor Red
}
