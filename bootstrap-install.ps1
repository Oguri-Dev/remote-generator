# ============================================================================
# BOOTSTRAP INSTALLER - Script que se descarga desde GitHub/Web
# Sistema de Control Remoto de Generador
# ============================================================================

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "    INSTALACION AUTOMATICA DESDE GITHUB" -ForegroundColor Cyan
Write-Host "              Sistema de Control de Generador" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# CONFIGURACION
# ============================================================================

$GITHUB_REPO = "https://github.com/Oguri-Dev/remote-generator.git"
$GITHUB_RAW = "https://raw.githubusercontent.com/Oguri-Dev/remote-generator/main"
$INSTALL_DIR = "C:\GeneradorControl"
$BRANCH = "main"

Write-Host "[*] Preparando instalacion..." -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# VERIFICAR REQUISITOS
# ============================================================================

Write-Host "[*] Verificando Docker..." -ForegroundColor Yellow

$dockerInstalled = docker --version 2>$null
if (-not $dockerInstalled) {
    Write-Host "[X] Docker no esta instalado." -ForegroundColor Red
    Write-Host "   Descargalo en: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "   1. Instala Docker Desktop" -ForegroundColor Cyan
    Write-Host "   2. Reinicia tu PC" -ForegroundColor Cyan
    Write-Host "   3. Vuelve a ejecutar este script" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "[X] Docker no esta corriendo." -ForegroundColor Red
    Write-Host "   Por favor, inicia Docker Desktop y espera a que este listo." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "[OK] Docker: $dockerInstalled" -ForegroundColor Green
Write-Host ""

# ============================================================================
# VERIFICAR/INSTALAR GIT
# ============================================================================

Write-Host "[*] Verificando Git..." -ForegroundColor Yellow

$gitInstalled = git --version 2>$null
if (-not $gitInstalled) {
    Write-Host "[!] Git no esta instalado." -ForegroundColor Yellow
    Write-Host "   Descargando Git..." -ForegroundColor Yellow
    
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe"
    $gitInstaller = "$env:TEMP\git-installer.exe"
    
    (New-Object System.Net.WebClient).DownloadFile($gitUrl, $gitInstaller)
    Write-Host "[OK] Git descargado. Instalando..." -ForegroundColor Green
    
    & $gitInstaller /SILENT /VERYSILENT
    $env:PATH += ";C:\Program Files\Git\cmd"
    
    Write-Host "[OK] Git instalado" -ForegroundColor Green
}

Write-Host "[OK] Git: $gitInstalled" -ForegroundColor Green
Write-Host ""

# ============================================================================
# CLONAR O ACTUALIZAR REPOSITORIO
# ============================================================================

Write-Host "[*] Descargando proyecto desde GitHub..." -ForegroundColor Yellow

if (Test-Path $INSTALL_DIR) {
    Write-Host "   Actualizando repositorio existente..." -ForegroundColor Cyan
    cd $INSTALL_DIR
    try {
        git pull origin $BRANCH
    } catch {
        Write-Host "[!] No se pudo actualizar. Limpiando e clonando..." -ForegroundColor Yellow
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

Write-Host "[OK] Proyecto descargado en: $INSTALL_DIR" -ForegroundColor Green
Write-Host ""

# ============================================================================
# APLICAR RESTRICCIONES DE SEGURIDAD
# ============================================================================

Write-Host "[*] Aplicando restricciones de seguridad..." -ForegroundColor Yellow

try {
    # Obtener el usuario actual
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    
    # Remover herencia de permisos
    icacls $INSTALL_DIR /inheritance:d /Q 2>$null
    
    # Dar permisos completos solo al usuario actual
    icacls $INSTALL_DIR /grant:r "$($currentUser):(F)" /Q 2>$null
    
    # Negar acceso a otros usuarios
    icacls $INSTALL_DIR /deny "Users:(M)" /Q 2>$null
    
    Write-Host "[OK] Permisos restringidos (solo para: $currentUser)" -ForegroundColor Green
} catch {
    Write-Host "[!] Advertencia: No se pudieron aplicar permisos restringidos" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# SOLICITAR CREDENCIALES
# ============================================================================

Write-Host "[*] Configuracion:" -ForegroundColor Yellow
Write-Host ""

$mongoUser = Read-Host "Usuario de MongoDB (default: admin)"
if ([string]::IsNullOrWhiteSpace($mongoUser)) { $mongoUser = "admin" }

$mongoPass = Read-Host "Contrasena de MongoDB (default: generador123)" -AsSecureString
$mongoPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($mongoPass))
if ([string]::IsNullOrWhiteSpace($mongoPassPlain)) { $mongoPassPlain = "generador123" }

Write-Host ""

# ============================================================================
# CREAR .env.docker
# ============================================================================

Write-Host "[*] Creando configuracion..." -ForegroundColor Yellow

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
Write-Host "[OK] Configuracion guardada" -ForegroundColor Green
Write-Host ""

# ============================================================================
# CREAR mosquitto.conf SI NO EXISTE
# ============================================================================

if (-not (Test-Path "mosquitto.conf")) {
    Write-Host "[*] Creando configuracion MQTT..." -ForegroundColor Yellow
    
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
    Write-Host "[OK] Configuracion MQTT guardada" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# INICIAR DOCKER COMPOSE
# ============================================================================

Write-Host "[*] Iniciando contenedores Docker..." -ForegroundColor Cyan
Write-Host "   [!] Esto puede tomar varios minutos la primera vez..." -ForegroundColor Yellow
Write-Host ""

docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[*] Esperando a que los servicios se inicien..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "                    INSTALACION COMPLETADA!" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ACCESO A LA APLICACION:" -ForegroundColor Cyan
    Write-Host "   Frontend:    http://localhost" -ForegroundColor White
    Write-Host "   Backend:     http://localhost:8099" -ForegroundColor White
    Write-Host "   MongoDB:     localhost:27017" -ForegroundColor White
    Write-Host "   MQTT:        localhost:1883 (WebSocket: 9001)" -ForegroundColor White
    Write-Host ""
    Write-Host "CREDENCIALES MONGODB:" -ForegroundColor Yellow
    Write-Host "   Usuario:     $mongoUser" -ForegroundColor White
    Write-Host "   Contrasena:  $mongoPassPlain" -ForegroundColor White
    Write-Host ""
    Write-Host "ESTADO DE SERVICIOS:" -ForegroundColor Yellow
    docker-compose ps
    Write-Host ""
    Write-Host "COMANDOS UTILES:" -ForegroundColor Yellow
    Write-Host "   Ver logs:    docker-compose logs -f" -ForegroundColor White
    Write-Host "   Detener:     docker-compose down" -ForegroundColor White
    Write-Host "   Reiniciar:   docker-compose restart" -ForegroundColor White
    Write-Host "   Estado:      docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "DATOS PERSISTENTES:" -ForegroundColor Yellow
    Write-Host "   MongoDB:     Volumen 'mongodb_data' (automatico)" -ForegroundColor White
    Write-Host "   MQTT:        Volumen 'mqtt_data' (automatico)" -ForegroundColor White
    Write-Host "   Los datos se mantienen aunque reinicies los contenedores" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "[X] Error al iniciar Docker Compose" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta ejecutar manualmente:" -ForegroundColor Yellow
    Write-Host "   cd $INSTALL_DIR" -ForegroundColor White
    Write-Host "   docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "[OK] Proceso completado exitosamente!" -ForegroundColor Green
Write-Host ""
