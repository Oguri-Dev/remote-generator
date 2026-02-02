# Script para verificar que todos los requisitos estén instalados

$ErrorActionPreference = "Continue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Verificador de Requisitos - Generador" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# Verificar Node.js
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Node.js no está instalado" -ForegroundColor Red
    Write-Host "         Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    $allOk = $false
}
Write-Host ""

# Verificar PNPM
Write-Host "[2/6] Verificando PNPM..." -ForegroundColor Yellow
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpm) {
    $pnpmVersion = pnpm --version
    Write-Host "  [OK] PNPM $pnpmVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] PNPM no está instalado" -ForegroundColor Red
    Write-Host "         Instala con: npm install -g pnpm" -ForegroundColor Yellow
    $allOk = $false
}
Write-Host ""

# Verificar Go
Write-Host "[3/6] Verificando Go..." -ForegroundColor Yellow
$go = Get-Command go -ErrorAction SilentlyContinue
if ($go) {
    $goVersion = go version
    Write-Host "  [OK] $goVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Go no está instalado" -ForegroundColor Red
    Write-Host "         Descarga desde: https://go.dev/dl/" -ForegroundColor Yellow
    $allOk = $false
}
Write-Host ""

# Verificar MongoDB
Write-Host "[4/6] Verificando MongoDB..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue

if ($mongoService -or $mongosh) {
    if ($mongoService) {
        Write-Host "  [OK] Servicio MongoDB encontrado - Estado: $($mongoService.Status)" -ForegroundColor Green
        if ($mongoService.Status -ne "Running") {
            Write-Host "         [AVISO] MongoDB no está corriendo. Inicia con: net start MongoDB" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [OK] MongoDB Shell (mongosh) encontrado" -ForegroundColor Green
        Write-Host "         (Puede ser MongoDB Atlas - cloud)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  [AVISO] MongoDB local no detectado" -ForegroundColor Yellow
    Write-Host "          Opciones:" -ForegroundColor Cyan
    Write-Host "          1. Instalar MongoDB Community: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "          2. Usar MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas" -ForegroundColor White
}
Write-Host ""

# Verificar Git (opcional)
Write-Host "[5/6] Verificando Git..." -ForegroundColor Yellow
$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
    $gitVersion = git --version
    Write-Host "  [OK] $gitVersion" -ForegroundColor Green
} else {
    Write-Host "  [OPCIONAL] Git no está instalado" -ForegroundColor Gray
    Write-Host "             Solo necesario para actualizaciones con git pull" -ForegroundColor Gray
}
Write-Host ""

# Verificar estructura del proyecto
Write-Host "[6/6] Verificando estructura del proyecto..." -ForegroundColor Yellow
$backendExists = Test-Path (Join-Path $PSScriptRoot "BackEnd")
$frontendExists = Test-Path (Join-Path $PSScriptRoot "FrontEnd")

if ($backendExists -and $frontendExists) {
    Write-Host "  [OK] Estructura del proyecto correcta" -ForegroundColor Green
    
    # Verificar archivos importantes
    $backendMain = Test-Path (Join-Path $PSScriptRoot "BackEnd\main.go")
    $frontendPackage = Test-Path (Join-Path $PSScriptRoot "FrontEnd\package.json")
    
    if ($backendMain) {
        Write-Host "      ✓ BackEnd/main.go" -ForegroundColor Green
    } else {
        Write-Host "      ✗ BackEnd/main.go no encontrado" -ForegroundColor Red
        $allOk = $false
    }
    
    if ($frontendPackage) {
        Write-Host "      ✓ FrontEnd/package.json" -ForegroundColor Green
    } else {
        Write-Host "      ✗ FrontEnd/package.json no encontrado" -ForegroundColor Red
        $allOk = $false
    }
} else {
    Write-Host "  [ERROR] Estructura del proyecto incorrecta" -ForegroundColor Red
    if (-not $backendExists) {
        Write-Host "         Falta carpeta: BackEnd" -ForegroundColor Red
    }
    if (-not $frontendExists) {
        Write-Host "         Falta carpeta: FrontEnd" -ForegroundColor Red
    }
    $allOk = $false
}
Write-Host ""

# Resumen
Write-Host "============================================" -ForegroundColor Cyan
if ($allOk) {
    Write-Host "  OK Todos los requisitos estan OK" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Configurar variables de entorno:" -ForegroundColor Yellow
    Write-Host "   cd BackEnd" -ForegroundColor White
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor White
    Write-Host "   notepad .env" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Instalar dependencias:" -ForegroundColor Yellow
    Write-Host "   cd BackEnd" -ForegroundColor White
    Write-Host "   go mod download" -ForegroundColor White
    Write-Host "   cd ..\FrontEnd" -ForegroundColor White
    Write-Host "   pnpm install" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Ejecutar el sistema:" -ForegroundColor Yellow
    Write-Host "   .\start-backend.ps1  (Terminal 1)" -ForegroundColor White
    Write-Host "   .\start-frontend.ps1 (Terminal 2)" -ForegroundColor White
    Write-Host ""
    Write-Host "4. O instalar como servicio:" -ForegroundColor Yellow
    Write-Host "   .\install-service.ps1 (como Administrador)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  X Hay requisitos faltantes" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Por favor, instala los componentes faltantes antes de continuar." -ForegroundColor Yellow
    Write-Host ""
}
