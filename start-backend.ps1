# Script PowerShell para iniciar Backend
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Iniciando Backend - Generador" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del backend
Set-Location "$PSScriptRoot\BackEnd"

# Configurar variables de entorno
$env:PORT = "8099"
$env:MONGODB_URI = "mongodb://localhost:27017"
$env:MONGODB_DB = "generator"
$env:MONGODB_COLL = "config"
$env:FRONTEND_ORIGIN = "http://localhost:3069"
$env:ENVIRONMENT = "development"

Write-Host "Puerto configurado: $env:PORT" -ForegroundColor Green
Write-Host "MongoDB: $env:MONGODB_URI" -ForegroundColor Green
Write-Host ""
Write-Host "Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""

# Ejecutar
go run main.go
