# Cria implantar.zip para upload na Hostinger (package.json na raiz do zip).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$staging = Join-Path $env:TEMP "solrecreio-hostinger-staging"
$zipOut = Join-Path $root "implantar.zip"
$zipDesktop = Join-Path ([Environment]::GetFolderPath("Desktop")) "implantar.zip"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$excludeDirs = @(
  "node_modules", ".next", ".git", "uploads", "android", ".cursor",
  "coverage", ".firebase", "out", "build", ".pnp", ".yarn"
)

robocopy $root $staging /E `
  /XD $excludeDirs `
  /XF .env .env.local .env.*.local implantar.zip serviceAccountKey.json `
  /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

if (-not (Test-Path (Join-Path $staging "package.json"))) {
  throw "package.json nao encontrado na raiz do staging."
}
if (-not (Test-Path (Join-Path $staging "src\app"))) {
  throw "src/app not found - invalid Next.js structure."
}

foreach ($zip in @($zipOut, $zipDesktop)) {
  if (Test-Path $zip) { Remove-Item $zip -Force }
}

# tar -a cria .zip com paths / (Linux); Compress-Archive usa \ e pode falhar na Hostinger.
Push-Location $staging
tar -a -c -f $zipOut *
Pop-Location
Copy-Item $zipOut $zipDesktop -Force

$sizeMB = [math]::Round((Get-Item $zipOut).Length / 1MB, 2)
Write-Host "OK: $zipOut (${sizeMB} MB)"
Write-Host "Desktop copy: $zipDesktop"

# Verificar raiz do zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipOut)
$top = $zip.Entries | ForEach-Object { ($_.FullName -split '/')[0] } | Sort-Object -Unique
Write-Host "Pastas/ficheiros na raiz do zip:" ($top -join ", ")
$hasPkg = $zip.Entries | Where-Object { $_.FullName -eq "package.json" -or $_.FullName -eq "./package.json" }
if (-not $hasPkg) { throw "ERRO: package.json nao esta na raiz do zip." }
Write-Host "package.json na raiz: OK"
$zip.Dispose()

Remove-Item $staging -Recurse -Force
