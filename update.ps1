# ============================================================================
# SCRIPT DE ACTUALIZACION - Sistema Control Generador
# Actualiza codigo sin perder datos - Instalacion en C:\GeneradorControl
# ============================================================================

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "    ACTUALIZACION DEL SISTEMA - Control Generador" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$INSTALL_DIR = "C:\GeneradorControl"

# Verificar que existe la instalacion
if (-not (Test-Path $INSTALL_DIR)) {
    Write-Host "[X] No se encontro instalacion en: $INSTALL_DIR" -ForegroundColor Red
    Write-Host "   Ejecuta el instalador primero" -ForegroundColor Yellow
    exit 1
}

cd $INSTALL_DIR

Write-Host "[1/5] Verificando Git..." -ForegroundColor Yellow
if (-not (git --version 2>$null)) {
    Write-Host "[X] Git no esta instalado" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Git detectado" -ForegroundColor Green

Write-Host "`n[2/5] Descargando ultimos cambios..." -ForegroundColor Yellow
# Respaldar mosquitto.conf local no rastreado para evitar errores de pull
if (Test-Path "$INSTALL_DIR\mosquitto.conf") {
    git ls-files --error-unmatch "mosquitto.conf" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $backupName = "mosquitto.conf.local.bak"
        Write-Host "   Se detecto mosquitto.conf local no rastreado. Respaldando en: $backupName" -ForegroundColor Yellow
        try {
            Rename-Item -Path "$INSTALL_DIR\mosquitto.conf" -NewName $backupName -Force
        } catch {
            Write-Host "[X] No se pudo respaldar mosquitto.conf" -ForegroundColor Red
            exit 1
        }
    }
}
git fetch origin
git pull origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Error al actualizar desde GitHub" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Codigo actualizado" -ForegroundColor Green

Write-Host "`n[3/5] Deteniendo contenedores..." -ForegroundColor Yellow
docker-compose down

Write-Host "`n[4/5] Reconstruyendo imagenes..." -ForegroundColor Yellow
Write-Host "   Esto puede tomar unos minutos...`n" -ForegroundColor Cyan
docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Error al construir imagenes" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Imagenes reconstruidas" -ForegroundColor Green

Write-Host "`n[5/5] Iniciando contenedores..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Start-Sleep -Seconds 10
    Write-Host "`n====================================================================" -ForegroundColor Green
    Write-Host "                 ACTUALIZACION COMPLETADA!" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ACCESO:" -ForegroundColor Cyan
    Write-Host "  Frontend:  http://localhost" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:8099`n" -ForegroundColor White
    Write-Host "NOTA: Los datos de MongoDB se mantuvieron intactos`n" -ForegroundColor Green
    docker-compose ps
} else {
    Write-Host "`n[X] Error al iniciar contenedores" -ForegroundColor Red
    Write-Host "Ejecuta: docker-compose up -d" -ForegroundColor Yellow
}

Write-Host "`nPresiona Enter para salir..." -ForegroundColor Gray
Read-Host
