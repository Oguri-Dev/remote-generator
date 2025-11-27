# Script PowerShell para iniciar Frontend
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Iniciando Frontend - Generador" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del frontend
Set-Location "$PSScriptRoot\FrontEnd"

# Verificar .env
if (Test-Path ".env") {
    Write-Host "[OK] Archivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Creando .env desde .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host ""
Write-Host "Iniciando servidor de desarrollo Vite..." -ForegroundColor Yellow
Write-Host "Puerto: 3069" -ForegroundColor Green
Write-Host ""

# Ejecutar
pnpm dev
