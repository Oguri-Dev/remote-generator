# ============================================
# Script de Prueba - Antes de Exportar
# ============================================
# Verifica que todo funcione antes de exportar
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Prueba Pre-Exportación" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

Write-Host "Verificando Docker..." -ForegroundColor Yellow
if (-not (docker info 2>$null)) {
    Write-Host "❌ Docker no está corriendo" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✅ Docker OK" -ForegroundColor Green
Write-Host ""

Write-Host "Compilando imágenes..." -ForegroundColor Yellow
docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en compilación" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✅ Compilación OK" -ForegroundColor Green
Write-Host ""

Write-Host "Iniciando servicios de prueba..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Esperando a que servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Estado de servicios:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Verificando salud de servicios..." -ForegroundColor Yellow
Write-Host ""

# Verificar Backend
Write-Host "  Backend (http://localhost:8099)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8099/api/auth/check-setup" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✅ Backend respondiendo" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Backend no responde" -ForegroundColor Red
}

# Verificar Frontend
Write-Host "  Frontend (http://localhost)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✅ Frontend respondiendo" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Frontend no responde" -ForegroundColor Red
}

Write-Host ""
Write-Host "Ver logs en tiempo real (Ctrl+C para salir):" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "Acceder a la aplicación:" -ForegroundColor Yellow
Write-Host "  http://localhost" -ForegroundColor White
Write-Host ""
Write-Host "Detener servicios:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host ""

$respuesta = Read-Host "¿Quieres ver los logs ahora? (S/N)"
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    docker-compose logs -f
}
