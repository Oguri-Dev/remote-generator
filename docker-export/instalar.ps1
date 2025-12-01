# ============================================
# Script de InstalaciÃ³n - Cliente
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Instalando Sistema Generador" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
if (-not (docker info 2>$null)) {
    Write-Host "ERROR: Docker no estÃ¡ corriendo" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Paso 1: Cargando imÃ¡genes Docker..." -ForegroundColor Yellow
Write-Host "  (Esto puede tomar 5-10 minutos)" -ForegroundColor Gray
Write-Host ""

# Cargar Backend
Write-Host "  Cargando Backend..." -ForegroundColor Cyan
docker load -i generador-backend.tar

# Cargar Frontend
Write-Host "  Cargando Frontend..." -ForegroundColor Cyan
docker load -i generador-frontend.tar

# Cargar MongoDB
Write-Host "  Cargando MongoDB..." -ForegroundColor Cyan
docker load -i mongo.tar

Write-Host ""
Write-Host "Paso 2: ConfiguraciÃ³n..." -ForegroundColor Yellow
Write-Host ""

# Verificar si existe .env.docker
if (-not (Test-Path ".env.docker")) {
    Write-Host "  Creando archivo de configuraciÃ³n..." -ForegroundColor Cyan
    Copy-Item ".env.docker.example" ".env.docker"
    
    Write-Host ""
    Write-Host "IMPORTANTE: Debes configurar la contraseÃ±a de MongoDB" -ForegroundColor Red
    Write-Host "Editando el archivo .env.docker" -ForegroundColor Yellow
    Write-Host ""
    
    $respuesta = Read-Host "Â¿Quieres editarlo ahora? (S/N)"
    if ($respuesta -eq "S" -or $respuesta -eq "s") {
        notepad .env.docker
    }
}

Write-Host ""
Write-Host "Paso 3: Iniciando servicios..." -ForegroundColor Yellow
Write-Host ""

# Iniciar con docker-compose
docker-compose up -d

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  âœ… InstalaciÃ³n Completada" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acceder a la aplicaciÃ³n en:" -ForegroundColor Cyan
Write-Host "  http://localhost" -ForegroundColor White
Write-Host ""
Write-Host "Para ver el estado:" -ForegroundColor Cyan
Write-Host "  docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""

pause
