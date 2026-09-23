$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $projectRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $bundledRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
    $bundledNode = Join-Path $bundledRuntime 'node\bin'
    $bundledPnpm = Join-Path $bundledRuntime 'bin\fallback'
    if (Test-Path (Join-Path $bundledNode 'node.exe')) {
        $env:PATH = $bundledNode + [System.IO.Path]::PathSeparator + $bundledPnpm + [System.IO.Path]::PathSeparator + $env:PATH
    }
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw 'Install Node 24 and pnpm 11.19.0, then run pnpm install.' }
if (-not (Test-Path 'node_modules')) { throw 'Run pnpm install --frozen-lockfile before starting the preview.' }
Write-Output 'Player: http://127.0.0.1:5173'
Write-Output 'Admin:  http://127.0.0.1:5174'
Write-Output 'Press Ctrl+C to stop both previews.'
pnpm dev
