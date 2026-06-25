param(
  [string]$Path = 'src'
)

$files = Get-ChildItem -Path $Path -Include *.tsx,*.ts -Recurse
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $original = $content
  $content = $content -replace 'shadow-\[2px_2px_0px_#1A1A1A\]','shadow-neo-sm'
  $content = $content -replace 'shadow-\[3px_3px_0px_#1A1A1A\]','shadow-neo-md'
  $content = $content -replace 'shadow-\[4px_4px_0px_#1A1A1A\]','shadow-neo'
  $content = $content -replace 'shadow-\[6px_6px_0px_#1A1A1A\]','shadow-neo-lg'
  $content = $content -replace 'shadow-\[8px_8px_0px_#1A1A1A\]','shadow-neo-xl'
  $content = $content -replace 'bg-\[#fcffe4\]','bg-bg-app'
  $content = $content -replace 'bg-\[#FF5722\]','bg-danger'
  $content = $content -replace 'bg-\[#FFD166\]','bg-warning'
  $content = $content -replace 'text-\[#FF5722\]','text-danger'
  $content = $content -replace 'border-\[#1A1A1A\]','border-ink'
  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Updated $($file.FullName)"
  }
}
