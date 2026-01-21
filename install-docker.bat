@echo off
REM ============================================================================
REM  SCRIPT DE INSTALACIÓN COMPLETA CON DOCKER
REM  Sistema de Control Remoto de Generador
REM ============================================================================

setlocal enabledelayedexpansion

cls
color 0A
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║    INSTALACIÓN DEL SISTEMA DE CONTROL DE GENERADOR                ║
echo ║              Con Docker, MongoDB y MQTT Broker                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM ============================================================================
REM 1. VERIFICAR DOCKER
REM ============================================================================

echo Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker no esta instalado.
    echo Descargalo en: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker Desktop no esta corriendo.
    echo Por favor, inicia Docker Desktop y vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VER=%%i
echo [OK] %DOCKER_VER%
echo.

REM ============================================================================
REM 2. SOLICITAR CREDENCIALES
REM ============================================================================

echo Configuracion:
echo.
set /p MONGO_USER="Usuario MongoDB (default: admin): "
if "!MONGO_USER!"=="" set MONGO_USER=admin

set /p MONGO_PASS="Contrasena MongoDB (default: changeme): "
if "!MONGO_PASS!"=="" set MONGO_PASS=changeme

echo.

REM ============================================================================
REM 3. CREAR .env.docker
REM ============================================================================

echo Creando archivo de configuracion (.env.docker)...

(
echo # CONFIGURACION DE DOCKER - SISTEMA DE CONTROL GENERADOR
echo # ============================================================================
echo.
echo # MongoDB
echo MONGO_ROOT_USER=%MONGO_USER%
echo MONGO_ROOT_PASSWORD=%MONGO_PASS%
echo.
echo # Backend
echo BACKEND_PORT=8099
echo FRONTEND_ORIGIN=http://localhost
echo.
echo # MQTT Broker
echo MQTT_PORT=1883
echo MQTT_WS_PORT=9001
echo.
echo # Frontend
echo FRONTEND_PORT=80
echo.
echo # Environment
echo ENVIRONMENT=production
) > .env.docker

echo [OK] Archivo .env.docker creado
echo.

REM ============================================================================
REM 4. CREAR mosquitto.conf
REM ============================================================================

echo Creando configuracion de MQTT Broker...

(
echo # Mosquitto MQTT Broker Configuration
echo # ============================================================================
echo.
echo # Puerto MQTT
echo port 1883
echo.
echo # WebSocket para clientes web
echo listener 9001
echo protocol websockets
echo.
echo # Almacenamiento persistente
echo persistence true
echo persistence_location /mosquitto/data/
echo.
echo # Logging
echo log_dest file /mosquitto/log/mosquitto.log
echo log_dest stdout
echo log_timestamp true
echo log_type all
echo.
echo # Seguridad
echo max_connections -1
echo keepalive_interval 60
) > mosquitto.conf

echo [OK] mosquitto.conf creado
echo.

REM ============================================================================
REM 5. INICIAR DOCKER COMPOSE
REM ============================================================================

echo.
echo Iniciando Docker Compose...
echo Por favor, espera mientras se descargan las imagenes...
echo [Esto puede tomar varios minutos la primera vez]
echo.

docker-compose up -d

if errorlevel 1 (
    echo.
    echo [ERROR] Hubo un problema al iniciar Docker Compose
    echo.
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                    INSTALACION COMPLETADA!                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo APLICACION DISPONIBLE EN:
echo   Frontend:    http://localhost
echo   Backend:     http://localhost:8099
echo   MQTT:        localhost:1883 (WebSocket: 9001)
echo   MongoDB:     localhost:27017
echo.
echo COMANDOS UTILES:
echo   Ver logs:    docker-compose logs -f
echo   Detener:     docker-compose down
echo   Reiniciar:   docker-compose restart
echo   Ver estado:  docker-compose ps
echo.
echo CREDENCIALES MONGODB:
echo   Usuario:     %MONGO_USER%
echo   Contrasena:  %MONGO_PASS%
echo.
echo Presiona cualquier tecla para finalizar...
pause

endlocal
