$filePath = Join-Path -Path $PSScriptRoot -ChildPath '..\app\(dashboard)\dashboard\planejamento\page.tsx'
$lines = [System.IO.File]::ReadAllLines($filePath)
$truncated = $lines[0..599]
[System.IO.File]::WriteAllLines($filePath, $truncated)
Write-Host "Truncated to $($truncated.Length) lines"
