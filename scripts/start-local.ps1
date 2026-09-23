$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $gameRoot
$gameRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$gameNode = Join-Path $gameRuntime 'node\bin\node.exe'
if (Get-Command node -ErrorAction SilentlyContinue) { $gameNode = (Get-Command node).Source }
if (-not (Test-Path -LiteralPath $gameNode)) { throw 'Node 24 is required.' }
if (-not (Test-Path '.local/runtime.env')) { throw 'Local database setup is required. See docs/LOCAL_MVP.md.' }
$gamePg = Join-Path $gameRoot '.cache\postgresql\pgsql\bin\pg_ctl.exe'
if (Test-Path -LiteralPath $gamePg) {
  & $gamePg -D '.local/pgdata' status 2>$null
  if ($LASTEXITCODE -ne 0) { & $gamePg -D '.local/pgdata' -l '.local/postgres.log' -o '-h 127.0.0.1 -p 55432' start }
}
try { $gameHealth = Invoke-RestMethod 'http://127.0.0.1:3000/v1/health' -TimeoutSec 2 } catch { $gameHealth = $null }
if (-not $gameHealth) {
  if (-not (Test-Path 'dist/server/apps/api/src/main.js')) { throw 'Run pnpm build:server first.' }
  Start-Process -FilePath $gameNode -ArgumentList @('--env-file=.local/runtime.env','dist/server/apps/api/src/main.js') -WorkingDirectory $gameRoot -WindowStyle Hidden -RedirectStandardOutput '.local/api.log' -RedirectStandardError '.local/api-error.log'
}
foreach ($gameClient in @(@{Port=5173;Name='player'},@{Port=5174;Name='admin'})) {
  try { $gameReady = Invoke-WebRequest "http://127.0.0.1:$($gameClient.Port)" -TimeoutSec 2; $gameStarted=$true } catch { $gameStarted=$false }
  if (-not $gameStarted) {
    $gameConfig = 'apps/' + $gameClient.Name + '/vite.config.ts'
    Start-Process -FilePath $gameNode -ArgumentList @('node_modules/vite/bin/vite.js','--config',$gameConfig) -WorkingDirectory $gameRoot -WindowStyle Hidden -RedirectStandardOutput ".local/$($gameClient.Name).log" -RedirectStandardError ".local/$($gameClient.Name)-error.log"
  }
}
Write-Output 'Player: http://127.0.0.1:5173'
Write-Output 'Admin:  http://127.0.0.1:5174'
Write-Output 'Local credentials are in .local/player-credentials.json and .local/admin-credentials.json.'
