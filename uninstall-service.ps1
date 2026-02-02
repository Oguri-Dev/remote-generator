# Script para desinstalar los servicios del Generador
# Ejecutar como Administrador

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Desinstalar Servicios - Generador" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que NSSM esté instalado
$nssmPath = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssmPath) {
    Write-Host "[ERROR] NSSM no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar que los servicios existen
$backendService = Get-Service -Name "GeneradorBackend" -ErrorAction SilentlyContinue
$frontendService = Get-Service -Name "GeneradorFrontend" -ErrorAction SilentlyContinue

if (-not $backendService -and -not $frontendService) {
    Write-Host "[AVISO] No hay servicios instalados" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host "Se van a desinstalar los siguientes servicios:" -ForegroundColor Yellow
if ($backendService) { Write-Host "  - GeneradorBackend" -ForegroundColor White }
if ($frontendService) { Write-Host "  - GeneradorFrontend" -ForegroundColor White }
Write-Host ""

$confirmation = Read-Host "¿Continuar? (s/n)"
if ($confirmation -ne 's' -and $confirmation -ne 'S') {
    Write-Host "Operación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Desinstalando servicios..." -ForegroundColor Yellow
Write-Host ""

if ($frontendService) {
    Write-Host "  [1/2] Desinstalando GeneradorFrontend..." -ForegroundColor Cyan
    nssm stop GeneradorFrontend 2>$null
    Start-Sleep -Seconds 2
    nssm remove GeneradorFrontend confirm
    Write-Host "  [OK] GeneradorFrontend desinstalado" -ForegroundColor Green
}

if ($backendService) {
    Write-Host "  [2/2] Desinstalando GeneradorBackend..." -ForegroundColor Cyan
    nssm stop GeneradorBackend 2>$null
    Start-Sleep -Seconds 2
    nssm remove GeneradorBackend confirm
    Write-Host "  [OK] GeneradorBackend desinstalado" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Servicios Desinstalados" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Los archivos del proyecto NO han sido eliminados." -ForegroundColor Cyan
Write-Host "Si deseas eliminar el proyecto completamente, borra la carpeta manualmente." -ForegroundColor Cyan
Write-Host ""
