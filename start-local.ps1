# ==============================================================================
# English Speaking Practice Manager - Unified Local Runner
# Boots the full-stack Vinext application with Cloudflare D1 local persistence
# Automatically selects an available, non-conflicting port
# ==============================================================================

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   ENGLISH SPEAKING PRACTICE MANAGER - LOCAL RUNNER     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Verify Node.js
Write-Host "[1/3] Verifying Node.js and npm..." -ForegroundColor Yellow
$nodeVersion = & node -v 2>$null
if (-not $nodeVersion) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js >= 22."
    exit 1
}
Write-Host "  -> Node.js version: $nodeVersion" -ForegroundColor Green

# 2. Check dependencies
if (-not (Test-Path (Join-Path $RepoRoot "node_modules"))) {
    Write-Host "  -> Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# 3. Check Drizzle schema & migrations
Write-Host "[2/3] Checking database schema & migrations..." -ForegroundColor Yellow
if (-not (Test-Path (Join-Path $RepoRoot "drizzle"))) {
    Write-Host "  -> Generating SQL migrations from Drizzle schema..." -ForegroundColor Yellow
    npm run db:generate
}
Write-Host "  -> D1 SQLite schema ready" -ForegroundColor Green

# 4. Find available port (never use already occupied ports)
function Get-AvailablePort([int]$startPort) {
    $port = $startPort
    while ($true) {
        $busy = $false
        # Check active TCP connections via Get-NetTCPConnection if available
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connections) {
                $busy = $true
            }
        } catch {}

        if (-not $busy) {
            try {
                $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
                $listener.Start()
                $listener.Stop()
                return $port
            } catch {
                $busy = $true
            }
        }
        $port++
    }
}

$AppPort = if ($env:PORT) { [int]$env:PORT } else { Get-AvailablePort 3200 }
Write-Host "[3/3] Launching unified full-stack server on free port $AppPort..." -ForegroundColor Yellow
Write-Host "  -> Local D1 database binding: DB" -ForegroundColor Cyan
Write-Host "  -> Application URL: http://localhost:$AppPort" -ForegroundColor Green

# Launch browser once the port is active
$browserWatcher = @"
for (`$i = 0; `$i -lt 40; `$i++) {
    Start-Sleep -Milliseconds 500
    try {
        `$tcp = [System.Net.Sockets.TcpClient]::new()
        `$tcp.Connect('127.0.0.1', $AppPort)
        `$tcp.Close()
        Start-Process "http://localhost:$AppPort"
        break
    } catch {}
}
"@
Start-Process powershell -ArgumentList "-NoProfile -Command `"$browserWatcher`"" -WindowStyle Hidden

# Run Vinext Dev
$env:PORT = $AppPort
& npx vinext dev --port $AppPort
