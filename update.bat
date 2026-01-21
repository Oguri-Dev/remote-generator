@echo off
REM ============================================================================
REM  ACTUALIZACION DEL SISTEMA - Control Generador
REM ============================================================================

setlocal
cls
color 0A

echo ====================================================================
echo     ACTUALIZACION DEL SISTEMA - Control Generador
echo ====================================================================
echo.

set INSTALL_DIR=C:\GeneradorControl

if not exist "%INSTALL_DIR%" (
    echo [ERROR] No se encontro instalacion en: %INSTALL_DIR%
    echo.
    pause
    exit /b 1
)

cd /d "%INSTALL_DIR%"

echo [1/5] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no esta instalado
    pause
    exit /b 1
)
echo [OK] Git detectado
echo.

echo [2/5] Descargando ultimos cambios...
git pull origin main
if errorlevel 1 (
    echo [ERROR] No se pudo actualizar desde GitHub
    pause
    exit /b 1
)
echo [OK] Codigo actualizado
echo.

echo [3/5] Deteniendo contenedores...
docker-compose down
echo.

echo [4/5] Reconstruyendo imagenes...
echo Esto puede tomar unos minutos...
echo.
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Error al construir imagenes
    pause
    exit /b 1
)
echo [OK] Imagenes reconstruidas
echo.

echo [5/5] Iniciando contenedores...
docker-compose up -d
timeout /t 10 /nobreak >nul
echo [OK]
echo.

echo ====================================================================
echo                  ACTUALIZACION COMPLETADA!
echo ====================================================================
echo.
echo ACCESO:
echo   Frontend: http://localhost
echo   Backend:  http://localhost:8099
echo.
echo NOTA: Los datos de MongoDB se mantuvieron intactos
echo.
docker-compose ps
echo.
echo Presiona cualquier tecla para salir...
pause >nul

endlocal
