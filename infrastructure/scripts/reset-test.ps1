$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposeTest = "$ScriptDir\..\docker\compose.test.yml"

Write-Host "====================================================" -ForegroundColor Magenta
Write-Host "  RESETTING TEST NAMESPACE (cinema-test)" -ForegroundColor Magenta
Write-Host "====================================================" -ForegroundColor Magenta

# Down containers and destroy only test-scoped volumes
docker compose -f "$ComposeTest" -p cinema-test down -v --remove-orphans

Write-Host "`n>>> Successfully wiped test containers and test volumes! <<<" -ForegroundColor Green
