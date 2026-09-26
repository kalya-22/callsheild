# CallShield FastAPI Backend & Cloud Tunnel Launcher
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   CallShield AI Voice Security Backend   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress

Write-Host "`n[+] Local IP Address: http://$($localIp):8000" -ForegroundColor Green
Write-Host "[+] Local Endpoint:  http://$($localIp):8000/api/v1" -ForegroundColor Green
Write-Host "[+] Mobile devices on the same Wi-Fi will connect to this server automatically!`n" -ForegroundColor Yellow

$env:PYTHONPATH = "$PSScriptRoot;$PSScriptRoot\backend"
Set-Location -Path "$PSScriptRoot\backend"
& "$PSScriptRoot\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
