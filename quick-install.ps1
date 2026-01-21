# Script simplificado de instalacion para evitar problemas de encoding
# Ejecuta: iex (iwr -Uri "https://raw.githubusercontent.com/Oguri-Dev/remote-generator/main/quick-install.ps1").Content

$ErrorActionPreference = "Stop"

Write-Host "====================================================================`n" -ForegroundColor Cyan
Write-Host "    INSTALACION AUTOMATICA - Sistema Control Generador`n" -ForegroundColor Cyan
Write-Host "====================================================================`n" -ForegroundColor Cyan

$GITHUB_REPO = "https://github.com/Oguri-Dev/remote-generator.git"
$INSTALL_DIR = "C:\GeneradorControl"
$BRANCH = "main"

# Verificar Docker
Write-Host "[1/5] Verificando Docker..." -ForegroundColor Yellow
if (-not (docker --version 2>$null)) {
    Write-Host "ERROR: Docker no esta instalado" -ForegroundColor Red
    Write-Host "Descarga: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
if (-not (docker info 2>$null)) {
    Write-Host "ERROR: Docker no esta corriendo" -ForegroundColor Red
    Write-Host "Inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK - Docker detectado" -ForegroundColor Green

# Verificar Git
Write-Host "`n[2/5] Verificando Git..." -ForegroundColor Yellow
if (-not (git --version 2>$null)) {
    Write-Host "Git no encontrado, instalando..." -ForegroundColor Yellow
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe"
    $gitInstaller = "$env:TEMP\git-installer.exe"
    (New-Object System.Net.WebClient).DownloadFile($gitUrl, $gitInstaller)
    Start-Process -FilePath $gitInstaller -ArgumentList "/SILENT" -Wait
    $env:PATH += ";C:\Program Files\Git\cmd"
}
Write-Host "OK - Git detectado" -ForegroundColor Green

# Clonar repositorio
Write-Host "`n[3/5] Descargando proyecto..." -ForegroundColor Yellow
if (Test-Path $INSTALL_DIR) {
    cd $INSTALL_DIR
    git pull origin $BRANCH 2>$null
} else {
    git clone --branch $BRANCH $GITHUB_REPO $INSTALL_DIR
    cd $INSTALL_DIR
}
Write-Host "OK - Proyecto descargado: $INSTALL_DIR" -ForegroundColor Green

# Restringir permisos de la carpeta
Write-Host "`nAplicando restricciones de seguridad..." -ForegroundColor Yellow
try {
    # Obtener el usuario actual
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    
    # Remover herencia de permisos
    icacls $INSTALL_DIR /inheritance:d /Q 2>$null
    
    # Dar permisos completos solo al usuario actual
    icacls $INSTALL_DIR /grant:r "$($currentUser):(F)" /Q 2>$null
    
    # Negar acceso a otros usuarios
    icacls $INSTALL_DIR /deny "Users:(M)" /Q 2>$null
    
    Write-Host "OK - Permisos restringidos (solo para: $currentUser)" -ForegroundColor Green
} catch {
    Write-Host "Advertencia: No se pudieron aplicar permisos restringidos" -ForegroundColor Yellow
}

# Configurar credenciales
Write-Host "`n[4/5] Configuracion MongoDB" -ForegroundColor Yellow
$mongoUser = Read-Host "Usuario MongoDB (default: admin)"
if ([string]::IsNullOrWhiteSpace($mongoUser)) { $mongoUser = "admin" }

$mongoPass = Read-Host "Contrasena MongoDB (default: generador123)" -AsSecureString
$mongoPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($mongoPass))
if ([string]::IsNullOrWhiteSpace($mongoPassPlain)) { $mongoPassPlain = "generador123" }

# Crear .env.docker
@"
MONGO_ROOT_USER=$mongoUser
MONGO_ROOT_PASSWORD=$mongoPassPlain
BACKEND_PORT=8099
FRONTEND_ORIGIN=http://localhost
MQTT_PORT=1883
MQTT_WS_PORT=9001
FRONTEND_PORT=80
ENVIRONMENT=production
"@ | Out-File -FilePath ".env.docker" -Encoding UTF8

# Crear mosquitto.conf si no existe
if (-not (Test-Path "mosquitto.conf")) {
@"
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
"@ | Out-File -FilePath "mosquitto.conf" -Encoding UTF8
}

Write-Host "OK - Configuracion guardada" -ForegroundColor Green

# Iniciar Docker
Write-Host "`n[5/5] Iniciando contenedores Docker..." -ForegroundColor Yellow
Write-Host "Esto puede tomar varios minutos la primera vez...`n" -ForegroundColor Cyan

docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Start-Sleep -Seconds 10
    Write-Host "`n====================================================================`n" -ForegroundColor Green
    Write-Host "                 INSTALACION COMPLETADA`n" -ForegroundColor Green
    Write-Host "====================================================================`n" -ForegroundColor Green
    Write-Host "ACCESO:" -ForegroundColor Cyan
    Write-Host "  Frontend:  http://localhost" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:8099" -ForegroundColor White
    Write-Host "  MongoDB:   localhost:27017" -ForegroundColor White
    Write-Host "  MQTT:      localhost:1883 (WebSocket: 9001)`n" -ForegroundColor White
    Write-Host "CREDENCIALES:" -ForegroundColor Yellow
    Write-Host "  Usuario:   $mongoUser" -ForegroundColor White
    Write-Host "  Password:  $mongoPassPlain`n" -ForegroundColor White
    Write-Host "COMANDOS:" -ForegroundColor Yellow
    Write-Host "  Ver logs:  docker-compose logs -f" -ForegroundColor White
    Write-Host "  Detener:   docker-compose down" -ForegroundColor White
    Write-Host "  Reiniciar: docker-compose restart`n" -ForegroundColor White
    docker-compose ps
} else {
    Write-Host "`nERROR al iniciar Docker Compose" -ForegroundColor Red
    Write-Host "Ejecuta manualmente: cd $INSTALL_DIR; docker-compose up -d" -ForegroundColor Yellow
}
