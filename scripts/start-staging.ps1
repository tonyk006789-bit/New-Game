$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $gameRoot
$stageNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (Get-Command node -ErrorAction SilentlyContinue) { $stageNode = (Get-Command node).Source }
if (-not (Test-Path '.local/staging/runtime.env')) { throw 'Run setup-staging.mjs first. See docs/STAGING.md.' }
foreach ($stageService in @(@{Port=3001;Name='api';Args=@('--env-file=.local/staging/runtime.env','dist/server/apps/api/src/main.js')},@{Port=5183;Name='player';Args=@('--env-file=.local/staging/runtime.env','node_modules/vite/bin/vite.js','--config','apps/player/vite.config.ts')},@{Port=5184;Name='admin';Args=@('--env-file=.local/staging/runtime.env','node_modules/vite/bin/vite.js','--config','apps/admin/vite.config.ts')})) {
 $stageUrl = if ($stageService.Name -eq 'api') { "http://127.0.0.1:$($stageService.Port)/v1/health" } else { "http://127.0.0.1:$($stageService.Port)" }
 try { $null=Invoke-WebRequest $stageUrl -TimeoutSec 2; $stageReady=$true } catch { $stageReady=$false }
 if (-not $stageReady) { Start-Process -FilePath $stageNode -ArgumentList $stageService.Args -WorkingDirectory $gameRoot -WindowStyle Hidden -RedirectStandardOutput ".local/staging/$($stageService.Name).log" -RedirectStandardError ".local/staging/$($stageService.Name)-error.log" }
}
Write-Output 'Staging player: http://127.0.0.1:5183 | admin: http://127.0.0.1:5184'
