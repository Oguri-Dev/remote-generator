# Script para instalar el sistema como servicios de Windows usando NSSM
# Ejecutar como Administrador

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Instalador de Servicios - Generador" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$ProjectPath = $PSScriptRoot
$BackendPath = Join-Path $ProjectPath "BackEnd"
$FrontendPath = Join-Path $ProjectPath "FrontEnd"
$BackendExe = Join-Path $BackendPath "generator-backend.exe"

# Verificar que NSSM esté instalado
Write-Host "[1/6] Verificando NSSM..." -ForegroundColor Yellow
$nssmPath = Get-Command nssm -ErrorAction SilentlyContinue

if (-not $nssmPath) {
    Write-Host "[ERROR] NSSM no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instala NSSM con uno de estos métodos:" -ForegroundColor Yellow
    Write-Host "  1. Chocolatey: choco install nssm" -ForegroundColor White
    Write-Host "  2. Scoop: scoop install nssm" -ForegroundColor White
    Write-Host "  3. Manual: https://nssm.cc/download" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "[OK] NSSM encontrado: $($nssmPath.Source)" -ForegroundColor Green
Write-Host ""

# Compilar Backend
Write-Host "[2/6] Compilando Backend..." -ForegroundColor Yellow
Push-Location $BackendPath
try {
    go build -o generator-backend.exe main.go
    if ($LASTEXITCODE -ne 0) {
        throw "Error al compilar backend"
    }
    Write-Host "[OK] Backend compilado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] No se pudo compilar el backend: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Compilar Frontend
Write-Host "[3/6] Compilando Frontend..." -ForegroundColor Yellow
Push-Location $FrontendPath
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw "Error al compilar frontend"
    }
    Write-Host "[OK] Frontend compilado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] No se pudo compilar el frontend: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Instalar serve si no está
Write-Host "[4/6] Verificando servidor HTTP (serve)..." -ForegroundColor Yellow
$servePath = Get-Command serve -ErrorAction SilentlyContinue
if (-not $servePath) {
    Write-Host "Instalando serve..." -ForegroundColor Yellow
    npm install -g serve
    $servePath = Get-Command serve
}
Write-Host "[OK] Serve encontrado: $($servePath.Source)" -ForegroundColor Green
Write-Host ""

# Detener servicios existentes si existen
Write-Host "[5/6] Verificando servicios existentes..." -ForegroundColor Yellow
$backendService = Get-Service -Name "GeneradorBackend" -ErrorAction SilentlyContinue
$frontendService = Get-Service -Name "GeneradorFrontend" -ErrorAction SilentlyContinue

if ($backendService) {
    Write-Host "Deteniendo servicio GeneradorBackend..." -ForegroundColor Yellow
    nssm stop GeneradorBackend
    Start-Sleep -Seconds 2
    nssm remove GeneradorBackend confirm
}

if ($frontendService) {
    Write-Host "Deteniendo servicio GeneradorFrontend..." -ForegroundColor Yellow
    nssm stop GeneradorFrontend
    Start-Sleep -Seconds 2
    nssm remove GeneradorFrontend confirm
}
Write-Host ""

# Instalar servicio Backend
Write-Host "[6/6] Instalando servicios..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  -> Instalando GeneradorBackend..." -ForegroundColor Cyan

nssm install GeneradorBackend "$BackendExe"
nssm set GeneradorBackend AppDirectory "$BackendPath"
nssm set GeneradorBackend DisplayName "Generador Control - Backend"
nssm set GeneradorBackend Description "Backend del sistema de control remoto de generador"
nssm set GeneradorBackend Start SERVICE_AUTO_START

# Configurar variables de entorno desde archivo .env si existe
$envFile = Join-Path $BackendPath ".env"
if (Test-Path $envFile) {
    Write-Host "  -> Cargando configuración desde .env..." -ForegroundColor Gray
    $envVars = @{}
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
        }
    }
    
    # Construir string de variables de entorno
    $envString = ($envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "`n"
    nssm set GeneradorBackend AppEnvironmentExtra $envString
} else {
    Write-Host "  -> Configurando variables de entorno por defecto..." -ForegroundColor Gray
    nssm set GeneradorBackend AppEnvironmentExtra @"
PORT=8099
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=generator
MONGODB_COLL=config
FRONTEND_ORIGIN=http://localhost:3069
ENVIRONMENT=production
"@
}

Write-Host "[OK] Servicio GeneradorBackend instalado" -ForegroundColor Green
Write-Host ""

# Instalar servicio Frontend
Write-Host "  -> Instalando GeneradorFrontend..." -ForegroundColor Cyan

$servePath = (Get-Command serve).Source
nssm install GeneradorFrontend "$servePath"
nssm set GeneradorFrontend AppParameters "-s dist -l 3069"
nssm set GeneradorFrontend AppDirectory "$FrontendPath"
nssm set GeneradorFrontend DisplayName "Generador Control - Frontend"
nssm set GeneradorFrontend Description "Frontend del sistema de control remoto de generador"
nssm set GeneradorFrontend Start SERVICE_AUTO_START

Write-Host "[OK] Servicio GeneradorFrontend instalado" -ForegroundColor Green
Write-Host ""

# Iniciar servicios
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Iniciando servicios..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Iniciando GeneradorBackend..." -ForegroundColor Yellow
nssm start GeneradorBackend
Start-Sleep -Seconds 3

Write-Host "Iniciando GeneradorFrontend..." -ForegroundColor Yellow
nssm start GeneradorFrontend
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ¡Instalación Completada!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Verificar estado
Write-Host "Estado de los servicios:" -ForegroundColor Cyan
Write-Host ""
Get-Service | Where-Object {$_.Name -like "Generador*"} | Format-Table -AutoSize
Write-Host ""

Write-Host "Accede al sistema en: http://localhost:3069" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor Yellow
Write-Host "  - Ver estado: .\start-services.ps1 status" -ForegroundColor White
Write-Host "  - Detener:    .\stop-services.ps1" -ForegroundColor White
Write-Host "  - Iniciar:    .\start-services.ps1" -ForegroundColor White
Write-Host "  - Logs:       nssm status GeneradorBackend" -ForegroundColor White
Write-Host ""
