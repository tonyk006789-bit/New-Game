$ErrorActionPreference = 'Stop'
$shareRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $shareRoot
$shareNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$shareTunnel = 'C:/Windows/System32/OpenSSH/ssh.exe'
if (-not (Test-Path 'apps/player/dist/index.html') -or -not (Test-Path '.local/staging/share-audience.json') -or -not (Test-Path $shareTunnel)) { throw 'Build the player, provision the five testers, and install the verified tunnel client first.' }
& (Join-Path $PSScriptRoot 'start-local.ps1')
& (Join-Path $PSScriptRoot 'start-staging.ps1')
try { $null=Invoke-WebRequest 'http://127.0.0.1:5185/' -TimeoutSec 2; $shareReady=$true } catch { $shareReady=$false }
if (-not $shareReady) { $shareGateway=Start-Process -FilePath $shareNode -ArgumentList @('scripts/share-gateway.mjs') -WorkingDirectory $shareRoot -WindowStyle Hidden -RedirectStandardOutput '.local/staging/share-gateway.log' -RedirectStandardError '.local/staging/share-gateway-error.log' -PassThru; $shareGateway.Id | Set-Content '.local/staging/share-gateway.pid' }
if (Test-Path '.local/staging/share-pinggy.pid') {
 $sharePrevious=Get-CimInstance Win32_Process -Filter "ProcessId = $((Get-Content '.local/staging/share-pinggy.pid').Trim())" -ErrorAction SilentlyContinue
 if ($sharePrevious -and $sharePrevious.CommandLine -like '*ssh.exe*0:127.0.0.1:5185*free.pinggy.io*' -and (Test-Path '.local/staging/share-link.json')) {
  $shareExisting=Get-Content '.local/staging/share-link.json' -Raw | ConvertFrom-Json
  if ($shareExisting.provider -eq 'Pinggy' -and $shareExisting.tunnelPid -eq $sharePrevious.ProcessId -and [DateTime]::Parse($shareExisting.expiresAt).ToUniversalTime() -gt [DateTime]::UtcNow) { Write-Output "Shared game: $($shareExisting.url) (expires $($shareExisting.expiresAt))"; exit 0 }
  throw 'An existing tunnel is still running but its link metadata is stale. Stop sharing before restarting.'
 }
}
& $shareNode (Join-Path $PSScriptRoot 'prepare-tunnel-key.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Could not prepare the dedicated tunnel key.' }
$shareStarted=[DateTime]::UtcNow
$shareProcess=Start-Process -FilePath $shareTunnel -ArgumentList @('-tt','-p','443','-o','BatchMode=yes','-o','StrictHostKeyChecking=accept-new','-o','UserKnownHostsFile=.local/staging/pinggy-known-hosts','-o','ServerAliveInterval=30','-o','ServerAliveCountMax=3','-o','ExitOnForwardFailure=yes','-o','ConnectTimeout=20','-o','IdentityAgent=none','-o','IdentitiesOnly=yes','-i','.local/staging/pinggy-key','-R','0:127.0.0.1:5185','free.pinggy.io','x:https') -WorkingDirectory $shareRoot -WindowStyle Hidden -RedirectStandardOutput '.local/staging/share-pinggy.log' -RedirectStandardError '.local/staging/share-pinggy-error.log' -PassThru
$shareProcess.Id | Set-Content '.local/staging/share-pinggy.pid'
for ($shareAttempt=0; $shareAttempt -lt 30; $shareAttempt++) {
 Start-Sleep -Seconds 1
 $shareLog=Get-Content '.local/staging/share-pinggy.log' -Raw -ErrorAction SilentlyContinue
 $shareMatch=[regex]::Match([string]$shareLog,'https://[a-z0-9.-]+\.(?:pinggy\.net|pinggy-free\.link|pinggy\.link)')
 if ($shareMatch.Success) {
  $shareUrl=$shareMatch.Value
  @{url=$shareUrl;provider='Pinggy';createdAt=$shareStarted.ToString('o');expiresAt=$shareStarted.AddMinutes(60).ToString('o');tunnelPid=$shareProcess.Id;note='Temporary free tunnel; expires after approximately one hour. Keep the computer awake.'} | ConvertTo-Json | Set-Content '.local/staging/share-link.json'
  Write-Output "Shared game: $shareUrl"
  Write-Output 'Free session lasts approximately one hour. Restarting produces a new URL; balances and history persist.'
  exit 0
 }
 if ($shareProcess.HasExited) { throw 'The tunnel could not start. Check .local/staging/share-pinggy-error.log.' }
}
throw 'The tunnel has not returned a URL yet. Inspect its log before starting another.'
