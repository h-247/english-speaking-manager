# ==============================================================================
# English Speaking Practice Manager - Unified Local Runner
# Boots the full-stack Vinext application with Cloudflare D1 local persistence
# Fast port detection & auto-browser launch
# ==============================================================================

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

try {
    $host.ui.RawUI.WindowTitle = "English Speaking Practice Manager - Local Runner"
} catch {}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   ENGLISH SPEAKING PRACTICE MANAGER - LOCAL RUNNER     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# Helper: Fast TCP port test (sub-millisecond IPv6 and IPv4 loopback checks)
# ------------------------------------------------------------------------------
function Test-PortResponding([int]$port) {
    # Test IPv6 Loopback (::1) - default for Vinext on Windows
    try {
        $tcp6 = [System.Net.Sockets.TcpClient]::new([System.Net.Sockets.AddressFamily]::InterNetworkV6)
        $ar6 = $tcp6.BeginConnect([System.Net.IPAddress]::IPv6Loopback, $port, $null, $null)
        if ($ar6.AsyncWaitHandle.WaitOne(600, $false) -and $tcp6.Connected) {
            $tcp6.EndConnect($ar6)
            $tcp6.Close()
            return $true
        }
        $tcp6.Close()
    } catch {}

    # Test IPv4 Loopback (127.0.0.1)
    try {
        $tcp4 = [System.Net.Sockets.TcpClient]::new([System.Net.Sockets.AddressFamily]::InterNetwork)
        $ar4 = $tcp4.BeginConnect([System.Net.IPAddress]::Loopback, $port, $null, $null)
        if ($ar4.AsyncWaitHandle.WaitOne(600, $false) -and $tcp4.Connected) {
            $tcp4.EndConnect($ar4)
            $tcp4.Close()
            return $true
        }
        $tcp4.Close()
    } catch {}

    return $false
}

# ------------------------------------------------------------------------------
# 0. Check if the server is ALREADY RUNNING
# ------------------------------------------------------------------------------
$DefaultPort = 3200

if (Test-PortResponding $DefaultPort) {
    Write-Host ""
    Write-Host "  [OK] English Speaking Manager is ALREADY RUNNING at http://localhost:$DefaultPort/sessions" -ForegroundColor Green
    Write-Host "  -> Launching default browser to: http://localhost:$DefaultPort/sessions" -ForegroundColor Cyan
    Start-Process "http://localhost:$DefaultPort/sessions"
    Write-Host ""
    Write-Host "  Press [R] within 5s to restart, or this window will auto-close..." -ForegroundColor Yellow

    $restart = $false
    for ($sec = 5; $sec -gt 0; $sec--) {
        Write-Host "`r  Auto-closing in $sec seconds... (Press 'R' to restart) " -NoNewline
        for ($ms = 0; $ms -lt 10; $ms++) {
            Start-Sleep -Milliseconds 100
            try {
                if ([System.Console]::KeyAvailable) {
                    $k = [System.Console]::ReadKey($true)
                    if ($k.KeyChar -eq 'r' -or $k.KeyChar -eq 'R') {
                        $restart = $true
                        break
                    }
                }
            } catch {}
        }
        if ($restart) { break }
    }
    Write-Host ""

    if (-not $restart) {
        Write-Host "  -> Existing server is kept running. Exiting runner." -ForegroundColor Green
        exit 0
    }

    Write-Host "  -> Stopping existing processes on port $DefaultPort..." -ForegroundColor Yellow
    try {
        $conns = Get-NetTCPConnection -LocalPort $DefaultPort -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    } catch {}
}

# ------------------------------------------------------------------------------
# 1. Verify Node.js and npm
# ------------------------------------------------------------------------------
Write-Host "[1/3] Verifying Node.js and npm..." -ForegroundColor Yellow
$nodeVersion = & node -v 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH. Please install Node.js >= 22." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    try { if ([System.Console]::IsInputRedirected -eq $false) { [void][System.Console]::ReadKey($true) } } catch {}
    exit 1
}
Write-Host "  -> Node.js version: $nodeVersion" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 2. Check dependencies and database migrations
# ------------------------------------------------------------------------------
if (-not (Test-Path (Join-Path $RepoRoot "node_modules"))) {
    Write-Host "  -> Installing dependencies (npm install)..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed." -ForegroundColor Red
        try { if ([System.Console]::IsInputRedirected -eq $false) { [void][System.Console]::ReadKey($true) } } catch {}
        exit 1
    }
}

Write-Host "[2/3] Checking database schema & migrations..." -ForegroundColor Yellow

# ------------------------------------------------------------------------------
# Data Persistence Protection & Auto-Backup
# Ensures user sessions, attempts, topics, and scores are never lost across repo updates
# ------------------------------------------------------------------------------
$d1StateDir = Join-Path $RepoRoot ".wrangler\state\v3\d1"
$backupDir = Join-Path $RepoRoot ".data-backup\d1"

function Get-ValidSqliteFile([string]$dir) {
    if (-not (Test-Path $dir)) { return $null }
    $files = Get-ChildItem -Path $dir -Recurse -Filter "*.sqlite" -File -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 4096 }
    if ($files -and $files.Count -gt 0) {
        return $files[0]
    }
    return $null
}

$d1Sqlite = Get-ValidSqliteFile $d1StateDir
$backupSqlite = Get-ValidSqliteFile $backupDir

# If live database is missing or empty, but backup has a valid database, restore it
if ((-not $d1Sqlite) -and $backupSqlite) {
    Write-Host "  -> Restoring database state from persistent backup..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $d1StateDir -Force | Out-Null
    Copy-Item -Path (Join-Path $backupDir "*") -Destination $d1StateDir -Recurse -Force
}
# Only back up live database if it contains a valid non-empty database (>4KB) to prevent overwriting with blank DB
elseif ($d1Sqlite) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item -Path (Join-Path $d1StateDir "*") -Destination $backupDir -Recurse -Force
    Write-Host "  -> Database persistence backup verified" -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $RepoRoot "drizzle"))) {
    Write-Host "  -> Generating SQL migrations from Drizzle schema..." -ForegroundColor Yellow
    & npm run db:generate
}
Write-Host "  -> D1 SQLite schema ready" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 3. Find available port (Instant TcpListener check)
# ------------------------------------------------------------------------------
function Get-AvailablePort([int]$startPort = 3200) {
    $port = $startPort
    while ($true) {
        if (-not (Test-PortResponding $port)) {
            $isFree = $true
            try {
                $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::IPv6Any, $port)
                $listener.Start()
                $listener.Stop()
            } catch {
                $isFree = $false
            }

            if ($isFree) {
                try {
                    $listener4 = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
                    $listener4.Start()
                    $listener4.Stop()
                } catch {
                    $isFree = $false
                }
            }

            if ($isFree) {
                return $port
            }
        }
        $port++
    }
}

$AppPort = if ($env:PORT) { [int]$env:PORT } else { Get-AvailablePort $DefaultPort }

if ($AppPort -ne $DefaultPort) {
    Write-Host "  [!] Port $DefaultPort is in use. Routed to free port: $AppPort" -ForegroundColor Magenta
}

Write-Host "[3/3] Launching unified full-stack server on port $AppPort..." -ForegroundColor Yellow
Write-Host "  -> Local D1 database binding: DB (.wrangler/state/v3/d1)" -ForegroundColor Cyan
Write-Host "  -> Application URL: http://localhost:$AppPort/sessions" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 4. Background browser launcher (robust Base64 encoded command)
# ------------------------------------------------------------------------------
$browserWatcher = @"
for (`$i = 0; `$i -lt 60; `$i++) {
    Start-Sleep -Milliseconds 400
    `$connected = `$false

    try {
        `$tcp6 = [System.Net.Sockets.TcpClient]::new([System.Net.Sockets.AddressFamily]::InterNetworkV6)
        `$ar6 = `$tcp6.BeginConnect([System.Net.IPAddress]::IPv6Loopback, $AppPort, `$null, `$null)
        if (`$ar6.AsyncWaitHandle.WaitOne(600, `$false) -and `$tcp6.Connected) {
            `$tcp6.EndConnect(`$ar6)
            `$connected = `$true
        }
        `$tcp6.Close()
    } catch {}

    if (-not `$connected) {
        try {
            `$tcp4 = [System.Net.Sockets.TcpClient]::new([System.Net.Sockets.AddressFamily]::InterNetwork)
            `$ar4 = `$tcp4.BeginConnect([System.Net.IPAddress]::Loopback, $AppPort, `$null, `$null)
            if (`$ar4.AsyncWaitHandle.WaitOne(600, `$false) -and `$tcp4.Connected) {
                `$tcp4.EndConnect(`$ar4)
                `$connected = `$true
            }
            `$tcp4.Close()
        } catch {}
    }

    if (`$connected) {
        Start-Process "http://localhost:$AppPort/sessions"
        break
    }
}
"@
$bwBytes = [System.Text.Encoding]::Unicode.GetBytes($browserWatcher)
$bwEncoded = [System.Convert]::ToBase64String($bwBytes)
Start-Process powershell.exe -ArgumentList "-NoProfile -EncodedCommand $bwEncoded" -WindowStyle Hidden

# ------------------------------------------------------------------------------
# 5. Run Vinext Dev
# ------------------------------------------------------------------------------
$env:PORT = $AppPort
$cliPath = Join-Path $RepoRoot "node_modules\vinext\dist\cli.js"

try {
    if (Test-Path $cliPath) {
        & node $cliPath dev --port $AppPort
    } else {
        & npm run dev
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    try { if ([System.Console]::IsInputRedirected -eq $false) { [void][System.Console]::ReadKey($true) } } catch {}
}
