# ============================================================================
# BOOTSTRAP INSTALLER - Script que se descarga desde GitHub/Web
# Sistema de Control Remoto de Generador
# ============================================================================
# Este script se ejecuta directamente desde GitHub sin necesidad de descargar nada

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🚀 INSTALACIÓN AUTOMÁTICA DESDE GITHUB                         ║" -ForegroundColor Cyan
Write-Host "║              Sistema de Control de Generador                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

$GITHUB_REPO = "https://github.com/Oguri-Dev/remote-generator.git"
$GITHUB_RAW = "https://raw.githubusercontent.com/Oguri-Dev/remote-generator/main"
$INSTALL_DIR = "$env:USERPROFILE\Desktop\Generador"
$BRANCH = "main"

Write-Host "⏳ Preparando instalación..." -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# VERIFICAR REQUISITOS
# ============================================================================

Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow

$dockerInstalled = docker --version 2>$null
if (-not $dockerInstalled) {
    Write-Host "❌ Docker no está instalado." -ForegroundColor Red
    Write-Host "   Descárgalo en: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "   1. Instala Docker Desktop" -ForegroundColor Cyan
    Write-Host "   2. Reinicia tu PC" -ForegroundColor Cyan
    Write-Host "   3. Vuelve a ejecutar este script" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker no está corriendo." -ForegroundColor Red
    Write-Host "   Por favor, inicia Docker Desktop y espera a que esté listo." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ Docker: $dockerInstalled" -ForegroundColor Green
Write-Host ""

# ============================================================================
# VERIFICAR/INSTALAR GIT
# ============================================================================

Write-Host "🔍 Verificando Git..." -ForegroundColor Yellow

$gitInstalled = git --version 2>$null
if (-not $gitInstalled) {
    Write-Host "⚠️  Git no está instalado." -ForegroundColor Yellow
    Write-Host "   Descargando Git..." -ForegroundColor Yellow
    
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe"
    $gitInstaller = "$env:TEMP\git-installer.exe"
    
    (New-Object System.Net.WebClient).DownloadFile($gitUrl, $gitInstaller)
    Write-Host "✅ Git descargado. Instalando..." -ForegroundColor Green
    
    & $gitInstaller /SILENT /VERYSILENT
    $env:PATH += ";C:\Program Files\Git\cmd"
    
    Write-Host "✅ Git instalado" -ForegroundColor Green
}

Write-Host "✅ Git: $gitInstalled" -ForegroundColor Green
Write-Host ""

# ============================================================================
# CLONAR O ACTUALIZAR REPOSITORIO
# ============================================================================

Write-Host "📥 Descargando proyecto desde GitHub..." -ForegroundColor Yellow

if (Test-Path $INSTALL_DIR) {
    Write-Host "   Actualizando repositorio existente..." -ForegroundColor Cyan
    cd $INSTALL_DIR
    try {
        git pull origin $BRANCH
    } catch {
        Write-Host "⚠️  No se pudo actualizar. Limpiando e clonando..." -ForegroundColor Yellow
        cd ..
        Remove-Item $INSTALL_DIR -Recurse -Force
        git clone --branch $BRANCH $GITHUB_REPO $INSTALL_DIR
        cd $INSTALL_DIR
    }
} else {
    Write-Host "   Clonando repositorio..." -ForegroundColor Cyan
    git clone --branch $BRANCH $GITHUB_REPO $INSTALL_DIR
    cd $INSTALL_DIR
}

Write-Host "✅ Proyecto descargado en: $INSTALL_DIR" -ForegroundColor Green
Write-Host ""

# ============================================================================
# SOLICITAR CREDENCIALES
# ============================================================================

Write-Host "⚙️  Configuración:" -ForegroundColor Yellow
Write-Host ""

$mongoUser = Read-Host "📝 Usuario de MongoDB (default: admin)"
if ([string]::IsNullOrWhiteSpace($mongoUser)) { $mongoUser = "admin" }

$mongoPass = Read-Host "📝 Contraseña de MongoDB (default: generador123)" -AsSecureString
$mongoPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($mongoPass))
if ([string]::IsNullOrWhiteSpace($mongoPassPlain)) { $mongoPassPlain = "generador123" }

Write-Host ""

# ============================================================================
# CREAR .env.docker
# ============================================================================

Write-Host "📝 Creando configuración..." -ForegroundColor Yellow

$envContent = @"
# CONFIGURACION DE DOCKER - SISTEMA DE CONTROL GENERADOR
MONGO_ROOT_USER=$mongoUser
MONGO_ROOT_PASSWORD=$mongoPassPlain
BACKEND_PORT=8099
FRONTEND_ORIGIN=http://localhost
MQTT_PORT=1883
MQTT_WS_PORT=9001
FRONTEND_PORT=80
ENVIRONMENT=production
"@

Set-Content -Path ".env.docker" -Value $envContent -Encoding UTF8
Write-Host "✅ Configuración guardada" -ForegroundColor Green
Write-Host ""

# ============================================================================
# CREAR mosquitto.conf SI NO EXISTE
# ============================================================================

if (-not (Test-Path "mosquitto.conf")) {
    Write-Host "🦟 Creando configuración MQTT..." -ForegroundColor Yellow
    
    $mosquittoConf = @"
port 1883
listener 9001
protocol websockets
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_timestamp true
log_type all
max_connections -1
keepalive_interval 60
"@
    
    Set-Content -Path "mosquitto.conf" -Value $mosquittoConf -Encoding UTF8
    Write-Host "✅ Configuración MQTT guardada" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# INICIAR DOCKER COMPOSE
# ============================================================================

Write-Host "🚀 Iniciando contenedores Docker..." -ForegroundColor Cyan
Write-Host "   ⏳ Esto puede tomar varios minutos la primera vez..." -ForegroundColor Yellow
Write-Host ""

docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "⏳ Esperando a que los servicios se inicien..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    ✅ ¡INSTALACIÓN COMPLETADA!                     ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 ACCESO A LA APLICACIÓN:" -ForegroundColor Cyan
    Write-Host "   Frontend:    http://localhost" -ForegroundColor White
    Write-Host "   Backend:     http://localhost:8099" -ForegroundColor White
    Write-Host "   MongoDB:     localhost:27017" -ForegroundColor White
    Write-Host "   MQTT:        localhost:1883 (WebSocket: 9001)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔐 CREDENCIALES MONGODB:" -ForegroundColor Yellow
    Write-Host "   Usuario:     $mongoUser" -ForegroundColor White
    Write-Host "   Contraseña:  $mongoPassPlain" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 ESTADO DE SERVICIOS:" -ForegroundColor Yellow
    docker-compose ps
    Write-Host ""
    Write-Host "💡 COMANDOS ÚTILES:" -ForegroundColor Yellow
    Write-Host "   Ver logs:    docker-compose logs -f" -ForegroundColor White
    Write-Host "   Detener:     docker-compose down" -ForegroundColor White
    Write-Host "   Reiniciar:   docker-compose restart" -ForegroundColor White
    Write-Host "   Estado:      docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "📦 DATOS PERSISTENTES:" -ForegroundColor Yellow
    Write-Host "   MongoDB:     Volumen 'mongodb_data' (automático)" -ForegroundColor White
    Write-Host "   MQTT:        Volumen 'mqtt_data' (automático)" -ForegroundColor White
    Write-Host "   Los datos se mantienen aunque reinicies los contenedores" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Error al iniciar Docker Compose" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta ejecutar manualmente:" -ForegroundColor Yellow
    Write-Host "   cd $INSTALL_DIR" -ForegroundColor White
    Write-Host "   docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✨ ¡Proceso completado exitosamente!" -ForegroundColor Green
Write-Host ""
