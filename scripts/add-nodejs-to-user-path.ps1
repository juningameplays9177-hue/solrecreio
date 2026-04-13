#Requires -Version 5.1
<#
  Adiciona a pasta do Node.js ao PATH do *usuário* (não exige administrador).
  Uso: clique com botão direito > Executar com PowerShell, ou:
       powershell -ExecutionPolicy Bypass -File .\scripts\add-nodejs-to-user-path.ps1
  Parâmetro opcional se o Node estiver em outro lugar:
       -NodeDir "D:\ferramentas\nodejs"
#>
param(
  [string]$NodeDir = "C:\Program Files\nodejs"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$nodeExe = Join-Path $NodeDir "node.exe"
if (-not (Test-Path -LiteralPath $nodeExe)) {
  Write-Host "ERRO: node.exe não encontrado em: $NodeDir" -ForegroundColor Red
  Write-Host "Passe o caminho correto: -NodeDir 'C:\seu\caminho\nodejs'"
  exit 1
}

$NodeDir = (Get-Item -LiteralPath $NodeDir).FullName.TrimEnd('\')

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($null -eq $userPath) { $userPath = "" }

$segments = @(
  $userPath -split ";" |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ }
)

$already = $false
foreach ($s in $segments) {
  try {
    $resolved = (Get-Item -LiteralPath $s -ErrorAction Stop).FullName.TrimEnd("\")
  } catch {
    $resolved = $s.TrimEnd("\")
  }
  if ($resolved -ieq $NodeDir) {
    $already = $true
    break
  }
}

if ($already) {
  Write-Host "OK: esta pasta já está no PATH do usuário:" -ForegroundColor Green
  Write-Host "    $NodeDir"
} else {
  $trimmed = $userPath.Trim().TrimEnd(";")
  if ([string]::IsNullOrWhiteSpace($trimmed)) {
    $newUserPath = $NodeDir
  } else {
    $newUserPath = "$trimmed;$NodeDir"
  }
  [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
  Write-Host "OK: adicionado ao PATH do usuário:" -ForegroundColor Green
  Write-Host "    $NodeDir"
}

# Esta janela do PowerShell passa a enxergar node/npm imediatamente
if (-not ($env:Path -split ";" | Where-Object { $_ -and ($_.TrimEnd("\") -ieq $NodeDir) })) {
  $env:Path = "$NodeDir;$env:Path"
}

Write-Host ""
Write-Host "Versão instalada:" -ForegroundColor Cyan
& $nodeExe -v
$npmCmd = Join-Path $NodeDir "npm.cmd"
if (Test-Path -LiteralPath $npmCmd) {
  & $npmCmd -v
}

Write-Host ""
Write-Host "Importante: feche e abra de novo o Cursor (ou um novo terminal) para outros processos herdarem o PATH." -ForegroundColor Yellow
