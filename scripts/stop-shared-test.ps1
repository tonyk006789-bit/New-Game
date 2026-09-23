$ErrorActionPreference='Stop'
$shareRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $shareRoot
foreach ($shareService in @(@{Name='share-tunnel';Match='*cloudflared*tunnel*http://127.0.0.1:5185*'},@{Name='share-ssh';Match='*ssh.exe*80:127.0.0.1:5185*nokey@localhost.run*'},@{Name='share-localtunnel';Match='*scripts/share-localtunnel.mjs*'},@{Name='share-pinggy';Match='*ssh.exe*0:127.0.0.1:5185*free.pinggy.io*'},@{Name='share-gateway';Match='*scripts/share-gateway.mjs*'})) {
 $sharePidFile=".local/staging/$($shareService.Name).pid"
 if (Test-Path $sharePidFile) { $shareProcess=Get-CimInstance Win32_Process -Filter "ProcessId = $((Get-Content $sharePidFile).Trim())" -ErrorAction SilentlyContinue; if ($shareProcess -and $shareProcess.CommandLine -like $shareService.Match) { Stop-Process -Id $shareProcess.ProcessId; Write-Output "Stopped $($shareService.Name)" } }
}
Write-Output 'Sharing is stopped. Local accounts, credits and history are preserved.'
