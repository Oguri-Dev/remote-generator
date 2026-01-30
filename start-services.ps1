# Script para iniciar los servicios del Generador

param(
    [string]$Action = "start"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Gestor de Servicios - Generador" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que los servicios existen
$backendService = Get-Service -Name "GeneradorBackend" -ErrorAction SilentlyContinue
$frontendService = Get-Service -Name "GeneradorFrontend" -ErrorAction SilentlyContinue

if (-not $backendService -or -not $frontendService) {
    Write-Host "[ERROR] Los servicios no están instalados" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejecuta primero: .\install-service.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if ($Action -eq "status") {
    Write-Host "Estado de los servicios:" -ForegroundColor Cyan
    Write-Host ""
    Get-Service | Where-Object {$_.Name -like "Generador*"} | Format-Table -AutoSize
    Write-Host ""
    
    Write-Host "Detalles del Backend:" -ForegroundColor Cyan
    nssm status GeneradorBackend
    Write-Host ""
    
    Write-Host "Detalles del Frontend:" -ForegroundColor Cyan
    nssm status GeneradorFrontend
    Write-Host ""
    
} else {
    Write-Host "Iniciando servicios..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "  [1/2] Iniciando GeneradorBackend..." -ForegroundColor Cyan
    try {
        Start-Service -Name "GeneradorBackend"
        Write-Host "  [OK] GeneradorBackend iniciado" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] No se pudo iniciar GeneradorBackend: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 3
    
    Write-Host "  [2/2] Iniciando GeneradorFrontend..." -ForegroundColor Cyan
    try {
        Start-Service -Name "GeneradorFrontend"
        Write-Host "  [OK] GeneradorFrontend iniciado" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] No se pudo iniciar GeneradorFrontend: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Servicios Iniciados" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    Get-Service | Where-Object {$_.Name -like "Generador*"} | Format-Table -AutoSize
    Write-Host ""
    Write-Host "Accede al sistema en: http://localhost:3069" -ForegroundColor Green
    Write-Host ""
}
