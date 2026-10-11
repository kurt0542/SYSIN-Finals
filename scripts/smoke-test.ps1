# Smoke test verification script for PlaylistHub (Windows PowerShell)
# Usage: .\scripts\smoke-test.ps1 [-TargetTag "1"]

param (
    [string]$TargetTag = "",
    [string]$ProxyUrl = "http://localhost:8080",
    [int]$MaxRetries = 15,
    [int]$DelaySec = 4
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Starting PlaylistHub End-to-End Smoke Test" -ForegroundColor Cyan
Write-Host "Target Base URL: $ProxyUrl"
if ($TargetTag) {
    Write-Host "Expected Build Tag: Build #$TargetTag"
}
Write-Host "==================================================" -ForegroundColor Cyan

for ($i = 1; $i -le $MaxRetries; $i++) {
    Write-Host "Attempt $i of ${MaxRetries}: Checking service endpoints..."
    
    $songsOk = $false
    $playlistsOk = $false
    $frontendOk = $false

    try {
        $songsRes = Invoke-WebRequest -Uri "$ProxyUrl/api/songs/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($songsRes.StatusCode -eq 200) { $songsOk = $true }
    } catch {}

    try {
        $playlistRes = Invoke-WebRequest -Uri "$ProxyUrl/api/playlists/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($playlistRes.StatusCode -eq 200) { $playlistsOk = $true }
    } catch {}

    try {
        $frontendRes = Invoke-WebRequest -Uri "$ProxyUrl/" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($frontendRes.StatusCode -eq 200) {
            if ($TargetTag) {
                if ($frontendRes.Content -match "Build #$TargetTag") { $frontendOk = $true }
            } else {
                if ($frontendRes.Content -match "Build #") { $frontendOk = $true }
            }
        }
    } catch {}

    if ($songsOk -and $playlistsOk -and $frontendOk) {
        Write-Host "SUCCESS: All microservices and frontend verified healthy!" -ForegroundColor Green
        exit 0
    }

    Write-Host "Waiting for services... (songs-api: $songsOk, playlist-api: $playlistsOk, frontend: $frontendOk)" -ForegroundColor Yellow
    Start-Sleep -Seconds $DelaySec
}

Write-Error "ERROR: Smoke test failed after $MaxRetries attempts!"
exit 1
