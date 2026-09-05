param (
    [Parameter(Position = 0)]
    [ValidateSet("unit", "full", "live-ai")]
    [string]$Suite = "unit",

    [switch]$KeepStack = $false
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path "$ScriptDir\..\.."
$ComposeTest = "$ScriptDir\..\docker\compose.test.yml"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  CINEMA TEST RUNNER: Mode = $Suite" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

function Run-UnitTests {
    Write-Host "`n>>> [1/2] Running .NET Unit Tests..." -ForegroundColor Yellow
    dotnet test "$RootDir\apps\backend\Backend.sln" -c Release --logger "trx;LogFileName=unit-results.trx"
    if ($LASTEXITCODE -ne 0) {
        Write-Error ".NET Unit tests FAILED with exit code $LASTEXITCODE"
    }

    Write-Host "`n>>> [2/2] Running Python AI Unit Tests..." -ForegroundColor Yellow
    Push-Location "$RootDir\services\ai"
    try {
        py -m pytest tests/unit -v --tb=short
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Python AI Unit tests FAILED with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }

    Write-Host "`n>>> ALL UNIT TESTS PASSED DETERMINISTICALLY! <<<" -ForegroundColor Green
}

function Run-FullTestSuite {
    Write-Host "`n>>> Starting Test Stack via Docker Compose (-p cinema-test)..." -ForegroundColor Yellow
    docker compose -f "$ComposeTest" -p cinema-test up -d --build --wait mssql redis qdrant ai-http
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start test infrastructure stack"
    }

    Write-Host "`n>>> Running Complete Test Suite (.NET Unit + Integration + Concurrency)..." -ForegroundColor Yellow
    dotnet test "$RootDir\apps\backend\Backend.sln" -c Release --logger "trx;LogFileName=full-results.trx"
    $testExit = $LASTEXITCODE

    if (-not $KeepStack) {
        Write-Host "`n>>> Tearing down test stack..." -ForegroundColor Yellow
        docker compose -f "$ComposeTest" -p cinema-test down
    }

    if ($testExit -ne 0) {
        Write-Error "Test suite failed with exit code $testExit"
    }

    Write-Host "`n>>> FULL TEST SUITE COMPLETED SUCCESSFULLY! <<<" -ForegroundColor Green
}

function Run-LiveAiSmoke {
    Write-Host "`n>>> Running Live AI Smoke Suite (Max 20 provider calls)..." -ForegroundColor Yellow
    Push-Location "$RootDir\services\ai"
    try {
        py -m pytest tests -m "live_ai" -v --tb=short
    }
    finally {
        Pop-Location
    }
}

switch ($Suite) {
    "unit" { Run-UnitTests }
    "full" { Run-FullTestSuite }
    "live-ai" { Run-LiveAiSmoke }
}
