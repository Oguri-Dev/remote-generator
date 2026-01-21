# ============================================================================
# 🚀 SCRIPT DE INSTALACIÓN COMPLETA CON DOCKER
# Sistema de Control Remoto de Generador
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🚀 INSTALACIÓN DEL SISTEMA DE CONTROL DE GENERADOR             ║" -ForegroundColor Cyan
Write-Host "║              Con Docker, MongoDB y MQTT Broker                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. VERIFICAR REQUISITOS
# ============================================================================

Write-Host "📋 Verificando requisitos..." -ForegroundColor Yellow

$dockerInstalled = docker --version 2>$null
if (-not $dockerInstalled) {
    Write-Host "❌ Docker no está instalado." -ForegroundColor Red
    Write-Host "   Descárgalo en: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker: $dockerInstalled" -ForegroundColor Green

$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker Desktop no está corriendo." -ForegroundColor Red
    Write-Host "   Por favor, inicia Docker Desktop y vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker Desktop está corriendo" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 2. SOLICITAR INFORMACIÓN AL USUARIO
# ============================================================================

Write-Host "⚙️  Configuración:" -ForegroundColor Yellow
Write-Host ""

$mongoUser = Read-Host "📝 Usuario de MongoDB (default: admin)"
if ([string]::IsNullOrWhiteSpace($mongoUser)) { $mongoUser = "admin" }

$mongoPass = Read-Host "📝 Contraseña de MongoDB (default: changeme)" -AsSecureString
$mongoPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($mongoPass))
if ([string]::IsNullOrWhiteSpace($mongoPassPlain)) { $mongoPassPlain = "changeme" }

Write-Host ""

# ============================================================================
# 3. CREAR ARCHIVO .env.docker
# ============================================================================

Write-Host "📝 Creando archivo de configuración (.env.docker)..." -ForegroundColor Yellow

$envContent = @"
# ============================================================================
# CONFIGURACIÓN DE DOCKER - SISTEMA DE CONTROL GENERADOR
# ============================================================================

# MongoDB
MONGO_ROOT_USER=$mongoUser
MONGO_ROOT_PASSWORD=$mongoPassPlain

# Backend
BACKEND_PORT=8099
FRONTEND_ORIGIN=http://localhost

# MQTT Broker
MQTT_PORT=1883
MQTT_WS_PORT=9001

# Frontend
FRONTEND_PORT=80

# Environment
ENVIRONMENT=production
"@

$envPath = "$(Get-Location)\.env.docker"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host "✅ Archivo .env.docker creado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 4. CREAR DOCKER-COMPOSE MEJORADO CON MQTT BROKER
# ============================================================================

Write-Host "🐳 Generando configuración de Docker Compose..." -ForegroundColor Yellow

$dockerComposeMqtt = @"
version: '3.8'

services:
  # ===== MongoDB =====
  mongodb:
    image: mongo:7.0
    container_name: generador-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: `${MONGO_ROOT_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: `${MONGO_ROOT_PASSWORD:-changeme}
      MONGO_INITDB_DATABASE: generator
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    networks:
      - generador-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # ===== MQTT Broker (Mosquitto) =====
  mqtt-broker:
    image: eclipse-mosquitto:latest
    container_name: generador-mqtt-broker
    restart: unless-stopped
    ports:
      - '`${MQTT_PORT:-1883}:1883'
      - '`${MQTT_WS_PORT:-9001}:9001'
    volumes:
      - mqtt_data:/mosquitto/data
      - mqtt_logs:/mosquitto/log
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
    networks:
      - generador-network
    healthcheck:
      test: ['CMD', 'mosquitto_sub', '-h', 'localhost', '-t', '`$SYS/broker/uptime']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # ===== Backend (Go) =====
  backend:
    build:
      context: ./BackEnd
      dockerfile: Dockerfile
    image: generador-backend:latest
    container_name: generador-backend
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
      mqtt-broker:
        condition: service_healthy
    environment:
      MONGODB_URI: mongodb://`${MONGO_ROOT_USER:-admin}:`${MONGO_ROOT_PASSWORD:-changeme}@mongodb:27017
      MONGODB_DB: generator
      MONGODB_COLL: config
      MQTT_BROKER: mqtt-broker:1883
      PORT: `${BACKEND_PORT:-8099}
      FRONTEND_ORIGIN: `${FRONTEND_ORIGIN:-http://localhost}
      ENVIRONMENT: production
    ports:
      - '`${BACKEND_PORT:-8099}:8099'
    networks:
      - generador-network
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--no-verbose',
          '--tries=1',
          '--spider',
          'http://localhost:8099/api/auth/check-setup',
        ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  # ===== Frontend (Vue + Nginx) =====
  frontend:
    build:
      context: ./FrontEnd
      dockerfile: Dockerfile.production
      target: production
      args:
        VITE_API_BASE_URL: http://localhost:8099
    image: generador-frontend:latest
    container_name: generador-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - '`${FRONTEND_PORT:-80}:80'
    networks:
      - generador-network
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:80/']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

# ===== Volúmenes =====
volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
  mqtt_data:
    driver: local
  mqtt_logs:
    driver: local

# ===== Redes =====
networks:
  generador-network:
    driver: bridge
"@

Set-Content -Path "$(Get-Location)\docker-compose.yml" -Value $dockerComposeMqtt -Encoding UTF8
Write-Host "✅ docker-compose.yml actualizado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 5. CREAR CONFIGURACIÓN DE MOSQUITTO
# ============================================================================

Write-Host "🦟 Creando configuración de MQTT Broker (Mosquitto)..." -ForegroundColor Yellow

$mosquittoConf = @"
# Mosquitto MQTT Broker Configuration
# ============================================================================

# Puerto estándar MQTT
port 1883

# WebSocket (para clientes web)
listener 9001
protocol websockets

# Almacenamiento persistente
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_timestamp true
log_type all

# Seguridad (descomenta para producción)
# allow_anonymous false
# password_file /mosquitto/config/passwd

# Máximo de conexiones
max_connections -1

# Keep alive
keepalive_interval 60
"@

Set-Content -Path "$(Get-Location)\mosquitto.conf" -Value $mosquittoConf -Encoding UTF8
Write-Host "✅ mosquitto.conf creado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 6. CREAR DIRECTORIO PARA DATOS
# ============================================================================

Write-Host "📁 Creando directorios necesarios..." -ForegroundColor Yellow

$dirs = @("BackEnd", "FrontEnd", "mongodb_data", "mqtt_data", "mqtt_logs")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Directorio creado: $dir" -ForegroundColor Green
    }
}
Write-Host ""

# ============================================================================
# 7. VERIFICAR ARCHIVOS DOCKERFILE
# ============================================================================

Write-Host "🔍 Verificando archivos necesarios..." -ForegroundColor Yellow

$requiredFiles = @(
    "BackEnd\Dockerfile",
    "FrontEnd\Dockerfile.production"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $file NO encontrado" -ForegroundColor Yellow
        $allFilesExist = $false
    }
}
Write-Host ""

if (-not $allFilesExist) {
    Write-Host "⚠️  Algunos archivos no se encontraron. Asegúrate de que el repositorio esté completo." -ForegroundColor Yellow
}

# ============================================================================
# 8. OPCIÓN DE INICIAR DOCKER
# ============================================================================

Write-Host "🚀 Iniciando contenedores..." -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "¿Deseas iniciar los contenedores ahora? (S/n)"
if ($response -ne "n" -and $response -ne "N") {
    Write-Host ""
    Write-Host "⏳ Iniciando Docker Compose..." -ForegroundColor Yellow
    Write-Host ""
    
    docker-compose up -d
    
    if ($?) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                    ✅ ¡INSTALACIÓN COMPLETADA!                     ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "📱 APLICACIÓN DISPONIBLE EN:" -ForegroundColor Green
        Write-Host "   🌐 Frontend: http://localhost" -ForegroundColor Cyan
        Write-Host "   ⚙️  Backend: http://localhost:8099" -ForegroundColor Cyan
        Write-Host "   🦟 MQTT Broker: localhost:1883 (WebSocket: 9001)" -ForegroundColor Cyan
        Write-Host "   🗄️  MongoDB: localhost:27017" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 COMANDOS ÚTILES:" -ForegroundColor Yellow
        Write-Host "   Ver logs:     docker-compose logs -f" -ForegroundColor White
        Write-Host "   Detener:      docker-compose down" -ForegroundColor White
        Write-Host "   Reiniciar:    docker-compose restart" -ForegroundColor White
        Write-Host "   Ver estado:   docker-compose ps" -ForegroundColor White
        Write-Host ""
        Write-Host "🔐 CREDENCIALES MONGODB:" -ForegroundColor Yellow
        Write-Host "   Usuario: $mongoUser" -ForegroundColor White
        Write-Host "   Contraseña: $mongoPassPlain" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Error al iniciar Docker Compose" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "📝 Configuración completada. Para iniciar manualmente, ejecuta:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "✨ Script finalizado correctamente" -ForegroundColor Green
Write-Host ""
