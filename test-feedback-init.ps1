# Test script for initFeedbackSheet action
$url = "https://script.google.com/macros/s/AKfycbwJ5DdUuS5k__U6z2fle19wBNRgDO2gVG9KmKt7csuq3nzHxldpwvtl0Vcs54en_vRrVw/exec"

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
