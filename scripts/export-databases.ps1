# Export all FEMS PostgreSQL databases to ./database-exports/
param(
  [string]$ContainerName = "fems-postgres",
  [string]$DbUser = "postgres",
  [string]$Password = $env:POSTGRES_PASSWORD
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "database-exports"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$exportDir = Join-Path $outDir $timestamp
New-Item -ItemType Directory -Force -Path $exportDir | Out-Null

if (-not $Password) {
  $envFile = Join-Path $root ".env"
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^\s*POSTGRES_PASSWORD=' } | Select-Object -First 1
    if ($line) { $Password = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'") }
  }
}
if (-not $Password) { $Password = "changeme" }

$databases = @(
  "auth_service_db",
  "asset_service_db",
  "service_request_service_db",
  "notification_service_db",
  "reporting_service_db"
)

$useDocker = $false
try {
  docker inspect $ContainerName --format "{{.State.Running}}" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $useDocker = $true }
} catch {
  $useDocker = $false
}

Write-Host "Exporting databases to $exportDir ..."
foreach ($db in $databases) {
  $file = Join-Path $exportDir "$db.sql"
  if ($useDocker) {
    docker exec -e PGPASSWORD=$Password $ContainerName pg_dump -U $DbUser -d $db --no-owner --no-acl | Set-Content -Path $file -Encoding UTF8
  } else {
    $env:PGPASSWORD = $Password
    & pg_dump -h 127.0.0.1 -p 5433 -U $DbUser -d $db -f $file --no-owner --no-acl
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Export failed for $db. Start Docker (docker compose up -d postgres) or install pg_dump."
  }
  Write-Host "  OK $db -> $file"
}

$manifest = @{
  exportedAt = (Get-Date).ToUniversalTime().ToString("o")
  method = if ($useDocker) { "docker" } else { "pg_dump" }
  container = if ($useDocker) { $ContainerName } else { $null }
  databases = $databases
} | ConvertTo-Json -Depth 3
$manifest | Set-Content (Join-Path $exportDir "manifest.json") -Encoding UTF8
Write-Host "Done. Manifest: $(Join-Path $exportDir 'manifest.json')"
