# Script de actualizacion rapida
# Ejecuta: iex (iwr -Uri "https://raw.githubusercontent.com/Oguri-Dev/remote-generator/main/quick-update.ps1").Content

Write-Host "Actualizando Sistema Control Generador...`n" -ForegroundColor Cyan

$INSTALL_DIR = "$env:USERPROFILE\Desktop\Generador"

if (-not (Test-Path $INSTALL_DIR)) {
    Write-Host "ERROR: Instalacion no encontrada en $INSTALL_DIR" -ForegroundColor Red
    exit 1
}

cd $INSTALL_DIR

Write-Host "[1/4] Descargando cambios..." -ForegroundColor Yellow
git pull origin main
Write-Host "[OK]`n" -ForegroundColor Green

Write-Host "[2/4] Deteniendo servicios..." -ForegroundColor Yellow
docker-compose down
Write-Host "[OK]`n" -ForegroundColor Green

Write-Host "[3/4] Reconstruyendo imagenes (puede tardar)..." -ForegroundColor Yellow
docker-compose build --no-cache
Write-Host "[OK]`n" -ForegroundColor Green

Write-Host "[4/4] Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 10
Write-Host "[OK]`n" -ForegroundColor Green

Write-Host "====================================`n" -ForegroundColor Green
Write-Host "  ACTUALIZACION COMPLETADA!`n" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Green
Write-Host "Acceso: http://localhost`n" -ForegroundColor Cyan
docker-compose ps
