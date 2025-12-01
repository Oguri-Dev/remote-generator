# ============================================
# Script de DesinstalaciÃ³n - Cliente
# ============================================

Write-Host "============================================" -ForegroundColor Red
Write-Host "  Desinstalando Sistema Generador" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""

$confirmacion = Read-Host "Â¿EstÃ¡s seguro? Esto eliminarÃ¡ TODOS los datos (S/N)"

if ($confirmacion -ne "S" -and $confirmacion -ne "s") {
    Write-Host "DesinstalaciÃ³n cancelada" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "Deteniendo y eliminando containers..." -ForegroundColor Yellow
docker-compose down -v

Write-Host ""
Write-Host "Eliminando imÃ¡genes..." -ForegroundColor Yellow
docker rmi generador-backend:latest 2>$null
docker rmi generador-frontend:latest 2>$null
docker rmi mongo:7.0 2>$null

Write-Host ""
Write-Host "âœ… DesinstalaciÃ³n completada" -ForegroundColor Green
Write-Host ""
Write-Host "Puedes eliminar esta carpeta manualmente si lo deseas" -ForegroundColor Yellow
Write-Host ""

pause
