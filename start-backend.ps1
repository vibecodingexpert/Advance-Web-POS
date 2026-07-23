$logFile = "$env:TEMP\backend.log"
$process = Start-Process -NoNewWindow -PassThru -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "C:\Users\Amir\Documents\New OpenCode Project\advance-web-pos\backend" -RedirectStandardOutput $logFile -RedirectStandardError $logFile
$process.Id | Out-File "$env:TEMP\backend.pid"
Write-Host "Backend started with PID: $($process.Id)"
