# TWZ LTD Setup Script for Windows PowerShell
# Run from project root: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== TWZ LTD Setup ===" -ForegroundColor Cyan

# Copy root .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host ".env already exists" -ForegroundColor Yellow
}

# Copy service .env files
Get-ChildItem -Recurse -Filter ".env.example" | ForEach-Object {
    $envFile = Join-Path $_.DirectoryName ".env"
    if (-not (Test-Path $envFile)) {
        Copy-Item $_.FullName $envFile
        Write-Host "Created $envFile" -ForegroundColor Green
    }
}

Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
npm install

Write-Host "`nBuilding shared package..." -ForegroundColor Cyan
npm run build -w @TWZ LTD/shared

Write-Host "`nGenerating Prisma clients..." -ForegroundColor Cyan
npm run generate:all

Write-Host "`nRunning migrations..." -ForegroundColor Cyan
npm run migrate:all

Write-Host "`nSeeding databases..." -ForegroundColor Cyan
npm run seed:all

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "Start services: npm run dev"
Write-Host "Frontend: http://localhost:5173"
Write-Host "API Gateway: http://localhost:4000"
Write-Host "`nDemo login: admin@TWZ LTD.local / Password123!"
