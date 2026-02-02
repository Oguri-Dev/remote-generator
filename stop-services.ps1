# Script para detener los servicios del Generador

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deteniendo Servicios - Generador" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que los servicios existen
$backendService = Get-Service -Name "GeneradorBackend" -ErrorAction SilentlyContinue
$frontendService = Get-Service -Name "GeneradorFrontend" -ErrorAction SilentlyContinue

if (-not $backendService -and -not $frontendService) {
    Write-Host "[ERROR] Los servicios no están instalados" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Deteniendo servicios..." -ForegroundColor Yellow
Write-Host ""

if ($frontendService) {
    Write-Host "  [1/2] Deteniendo GeneradorFrontend..." -ForegroundColor Cyan
    try {
        Stop-Service -Name "GeneradorFrontend" -Force
        Write-Host "  [OK] GeneradorFrontend detenido" -ForegroundColor Green
    } catch {
        Write-Host "  [AVISO] No se pudo detener GeneradorFrontend: $_" -ForegroundColor Yellow
    }
}

Start-Sleep -Seconds 2

if ($backendService) {
    Write-Host "  [2/2] Deteniendo GeneradorBackend..." -ForegroundColor Cyan
    try {
        Stop-Service -Name "GeneradorBackend" -Force
        Write-Host "  [OK] GeneradorBackend detenido" -ForegroundColor Green
    } catch {
        Write-Host "  [AVISO] No se pudo detener GeneradorBackend: $_" -ForegroundColor Yellow
    }
}

Start-Sleep -Seconds 1
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Servicios Detenidos" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Get-Service | Where-Object {$_.Name -like "Generador*"} | Format-Table -AutoSize
Write-Host ""
