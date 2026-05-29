# Automated Build & Copy Script
Write-Host "1. Building Frontend (Next.js)..." -ForegroundColor Green
cd Frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    cd ..
    exit
}

Write-Host "`n2. Clearing old Backend public assets..." -ForegroundColor Green
cd ..
if (Test-Path Backend/public/frontend) {
    Remove-Item -Path Backend/public/frontend/* -Recurse -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path Backend/public/frontend -Force | Out-Null
}

Write-Host "`n3. Copying static export to Backend public/frontend..." -ForegroundColor Green
Copy-Item -Path Frontend/out/* -Destination Backend/public/frontend -Recurse -Force

Write-Host "`n✅ Done! Now commit your code and push it to GitHub." -ForegroundColor Green
