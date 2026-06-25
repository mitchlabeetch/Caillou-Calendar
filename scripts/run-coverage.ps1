$p = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "test:coverage" -Wait -PassThru -NoNewWindow -RedirectStandardOutput "cov3.txt" -RedirectStandardError "cov3.err.txt"
Write-Host "ExitCode: $($p.ExitCode)"
Write-Host "---STDOUT (last 30 lines)---"
Get-Content "cov3.txt" | Select-Object -Last 30
Write-Host "---STDERR (last 30 lines)---"
Get-Content "cov3.err.txt" | Select-Object -Last 30
